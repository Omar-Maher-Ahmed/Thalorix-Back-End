import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosInstance } from 'axios';

import {
  Project,
  ProjectDocument,
  ProjectFile,
  ProjectStatus,
} from './schema/project.schema';
import { CreateProjectDto } from './dto/create-ai.dto';
import { EditProjectDto } from './dto/edit-project.dto';

// ─── API response shapes (as documented by the AI Builder API) ────────────────

interface ChatApiResponse {
  ok: boolean;
  session_id: string;
  job_id: string;
  message?: string;
}

interface JobApiResponse {
  ok: boolean;
  job_id: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  result?: {
    preview_url?: string;
    files?: Array<{ path: string; content: string; language?: string }>;
  };
  build_errors?: string[];
  message?: string;
}

// ─── Polling constants ────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000;   // 5 s between each status check
const MAX_POLL_ATTEMPTS = 36;     // 36 × 5 s = 3 min hard cap

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AiBuilderService {
  private readonly logger = new Logger(AiBuilderService.name);
  private readonly http: AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {
    const baseURL = this.config.get<string>('AI_BUILDER_API_URL');
    const apiKey  = this.config.get<string>('AI_BUILDER_API_KEY');

    this.http = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      timeout: 15_000,
    });
  }

  // ── 1. Generate Project ─────────────────────────────────────────────────────

  /**
   * Fires a POST /chat request with async: true.
   * Immediately persists a "building" project document, then kicks off
   * background polling.  Returns the persisted document so the controller
   * can hand back a projectId to the caller right away.
   */
  async generateProject(dto: CreateProjectDto): Promise<ProjectDocument> {
    const { prompt, stack, userId } = dto;

    // ── Step 1: kick off async build ─────────────────────────────────────────
    let chatData: ChatApiResponse;
    try {
      const { data } = await this.http.post<ChatApiResponse>('/chat', {
        message: prompt,
        async: true,
        ...(stack ? { stack } : {}),
      });
      chatData = data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message;
      this.logger.error(`AI Builder /chat failed: ${msg}`);
      throw new InternalServerErrorException(
        `AI Builder API error: ${msg}`,
      );
    }

    if (!chatData.ok) {
      throw new InternalServerErrorException(
        `AI Builder rejected request: ${chatData.message ?? 'unknown error'}`,
      );
    }

    // ── Step 2: persist skeleton project ─────────────────────────────────────
    const project = await this.projectModel.create({
      sessionId: chatData.session_id,
      jobId:     chatData.job_id,
      status:    ProjectStatus.BUILDING,
      stack:     stack ?? '',
      userId:    userId ?? null,
    });

    this.logger.log(
      `Project created [${project._id}] | job=${chatData.job_id} | session=${chatData.session_id}`,
    );

    // ── Step 3: background polling (non-blocking) ─────────────────────────────
    // We intentionally do NOT await so the HTTP response is immediate.
    this.pollAndFinalize(project._id.toString(), chatData.job_id).catch(
      (err) =>
        this.logger.error(
          `Background polling failed for project ${project._id}: ${err.message}`,
        ),
    );

    return project;
  }

  // ── 2. Polling Logic ────────────────────────────────────────────────────────

  /**
   * Polls GET /job/:id every POLL_INTERVAL_MS milliseconds.
   * Handles transitions: pending → running → done | failed.
   * Updates the project document on every meaningful status change.
   *
   * Thread-safety note: each project triggers exactly one polling chain.
   * The chain is idempotent—if a status is already terminal when this
   * runs (e.g. retried after a crash) it will exit without overwriting data.
   */
  async pollAndFinalize(
    projectId: string,
    jobId: string,
  ): Promise<void> {
    let attempts = 0;

    while (attempts < MAX_POLL_ATTEMPTS) {
      await this.sleep(POLL_INTERVAL_MS);
      attempts++;

      let jobData: JobApiResponse;
      try {
        const { data } = await this.http.get<JobApiResponse>(`/job/${jobId}`);
        jobData = data;
      } catch (err) {
        this.logger.warn(
          `Poll attempt ${attempts} failed for job ${jobId}: ${err.message}`,
        );
        continue; // transient network error → retry
      }

      this.logger.debug(
        `Poll [${attempts}/${MAX_POLL_ATTEMPTS}] job=${jobId} status=${jobData.status}`,
      );

      // ── Terminal: failed ────────────────────────────────────────────────────
      if (jobData.status === 'failed' || !jobData.ok) {
        const buildErrors = jobData.build_errors ?? [];
        this.logger.warn(
          `Job ${jobId} failed. Errors: ${buildErrors.join(', ')}`,
        );

        await this.projectModel.findByIdAndUpdate(projectId, {
          status:      ProjectStatus.FAILED,
          buildErrors,
          jobId,
        });
        return;
      }

      // ── Terminal: done ──────────────────────────────────────────────────────
      if (jobData.status === 'done') {
        const result = jobData.result ?? {};

        const files: ProjectFile[] = (result.files ?? []).map((f) => ({
          path:     f.path,
          content:  f.content,
          language: f.language ?? '',
        }));

        await this.projectModel.findByIdAndUpdate(projectId, {
          status:     ProjectStatus.COMPLETED,
          previewUrl: result.preview_url ?? null,
          files,
          jobId,
          buildErrors: [],
        });

        this.logger.log(
          `Project ${projectId} completed. preview=${result.preview_url ?? 'none'}`,
        );
        return;
      }

      // pending / running → keep polling
    }

    // ── Timed out ─────────────────────────────────────────────────────────────
    this.logger.error(
      `Polling timed out for job ${jobId} after ${MAX_POLL_ATTEMPTS} attempts`,
    );
    await this.projectModel.findByIdAndUpdate(projectId, {
      status:     ProjectStatus.FAILED,
      buildErrors: ['Build timed out after maximum polling attempts'],
    });
  }

  // ── 3. Retrieve Project ─────────────────────────────────────────────────────

  async findProject(projectId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).lean();
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return project as ProjectDocument;
  }

  // ── 4. Edit Flow ────────────────────────────────────────────────────────────

  /**
   * Sends the user's edit prompt to the AI Builder using the existing session_id,
   * maintaining full conversation memory and project context.
   * A new job_id is issued; we reset status to "building" and re-poll.
   */
  async editProject(
    projectId: string,
    dto: EditProjectDto,
  ): Promise<ProjectDocument> {
    const existing = await this.projectModel.findById(projectId);
    if (!existing) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // ── Re-send with the same session_id ─────────────────────────────────────
    let chatData: ChatApiResponse;
    try {
      const { data } = await this.http.post<ChatApiResponse>('/chat', {
        message:    dto.prompt,
        async:      true,
        session_id: existing.sessionId,  // ← key for continuity
      });
      chatData = data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message;
      this.logger.error(`AI Builder /chat (edit) failed: ${msg}`);
      throw new InternalServerErrorException(`AI Builder API error: ${msg}`);
    }

    if (!chatData.ok) {
      throw new InternalServerErrorException(
        `AI Builder rejected edit: ${chatData.message ?? 'unknown error'}`,
      );
    }

    // ── Reset document to building state ──────────────────────────────────────
    existing.status     = ProjectStatus.BUILDING;
    existing.jobId      = chatData.job_id;
    existing.previewUrl = null;
    existing.files      = [];
    existing.buildErrors = [];
    await existing.save();

    this.logger.log(
      `Project ${projectId} edit started | new job=${chatData.job_id}`,
    );

    // ── Background polling ────────────────────────────────────────────────────
    this.pollAndFinalize(projectId, chatData.job_id).catch((err) =>
      this.logger.error(
        `Background polling (edit) failed for project ${projectId}: ${err.message}`,
      ),
    );

    return existing;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
