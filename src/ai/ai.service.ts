import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import * as FormData from 'form-data';

import {
  Project,
  ProjectDocument,
  ProjectFile,
  ProjectStatus,
} from './schema/project.schema';
import { CreateProjectDto } from './dto/create-ai.dto';
import { EditProjectDto } from './dto/edit-project.dto';

// ─── Deployment mode ──────────────────────────────────────────────────────────

type DeploymentMode = 'direct' | 'runpod';

// ─── API response shapes ──────────────────────────────────────────────────────

interface ChatApiResponse {
  ok: boolean;
  session_id: string;
  job_id?: string;
  reply_type?: string;
  intent?: string;
  reply?: string;
  message?: string;
  files?: Array<{ path: string; content: string; language?: string }>;
  build_errors?: string[];
  build_duration_seconds?: number;
}

interface JobApiResponse {
  ok?: boolean;
  job_id?: string;
  // Direct HTTP statuses
  status?: 'pending' | 'running' | 'done' | 'failed' | 'completed' | 'error' | 'cancelled';
  // RunPod statuses
  output?: any;
  error?: string;
  result?: {
    preview_url?: string;
    project_name?: string;
    files?: Array<{ path: string; content: string; language?: string }>;
  };
  build_errors?: string[];
  message?: string;
}

interface ReadyResponse {
  status: string;
  ready?: boolean;
}

// ─── Polling constants ────────────────────────────────────────────────────────

const POLL_INTERVAL_MS  = 3_000;   // 3 s as documented
const MAX_POLL_ATTEMPTS = 60;      // 60 × 3 s = 3 min hard cap

// Terminal statuses that stop polling (covers both Direct and RunPod)
const TERMINAL_STATUSES = new Set(['completed', 'done', 'failed', 'error', 'cancelled']);

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AiBuilderService {
  private readonly logger = new Logger(AiBuilderService.name);

  /** Mode: 'direct' | 'runpod' */
  private readonly mode: DeploymentMode;

  /** Axios client — baseURL & auth set according to mode */
  private readonly http: AxiosInstance;

  /** Separate admin-only client for /admin/* (Direct mode only) */
  private readonly adminHttp: AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {
    this.mode = (this.config.get<string>('AI_BUILDER_MODE') ?? 'direct').toLowerCase() as DeploymentMode;
    this.logger.log(`AI Builder mode: ${this.mode.toUpperCase()}`);

    if (this.mode === 'runpod') {
      const baseURL = this.config.get<string>('RUNPOD_BASE_URL');
      const apiKey  = this.config.get<string>('RUNPOD_API_KEY');

      this.http = axios.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 30_000,
      });

      // adminHttp not used in RunPod mode but we need a fallback
      this.adminHttp = this.http;
    } else {
      // ── Direct HTTP ──────────────────────────────────────────────────────────
      const baseURL  = this.config.get<string>('AI_BUILDER_API_URL') ?? 'http://127.0.0.1:8000';
      const adminKey = this.config.get<string>('AI_ADMIN_KEY');

      // Public client (no auth) — used for /chat, /upload, /job, /health, /ready
      this.http = axios.create({
        baseURL,
        headers: { 'Content-Type': 'application/json' },
        timeout: 30_000,
      });

      // Admin client — used only for /admin/* endpoints
      this.adminHttp = axios.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey ? { Authorization: `Bearer ${adminKey}` } : {}),
        },
        timeout: 15_000,
      });
    }
  }

  // ── Health & Readiness ──────────────────────────────────────────────────────

  /**
   * GET /health — available in both modes.
   */
  async health(): Promise<any> {
    const { data } = await this.http.get('/health');
    return data;
  }

  // Track whether we already warned about missing /ready (avoid log spam)
  private readyEndpointMissing = false;

  /**
   * GET /ready — returns 503 while models load, 200 when ready.
   * Falls back silently to GET /health if /ready doesn't exist (404).
   * Only throws on genuine network errors (ECONNREFUSED etc.)
   */
  async ready(): Promise<{ ready: boolean; raw: ReadyResponse }> {
    try {
      const { data } = await this.http.get<ReadyResponse>('/ready');
      return { ready: true, raw: data };
    } catch (err) {
      const status: number | undefined = err?.response?.status;

      if (status === 503) {
        // Models still loading — expected during cold start
        return { ready: false, raw: err.response.data };
      }

      if (status === 404) {
        // /ready endpoint doesn't exist — fall back to /health silently
        if (!this.readyEndpointMissing) {
          this.logger.warn('AI Builder has no /ready endpoint — falling back to /health for readiness checks.');
          this.readyEndpointMissing = true;
        }
        try {
          const { data } = await this.http.get('/health');
          return { ready: true, raw: data };
        } catch {
          throw new InternalServerErrorException('AI Builder is unreachable (/health also failed)');
        }
      }

      if (status != null) {
        // Any other HTTP response means server IS up
        return { ready: true, raw: err.response?.data ?? {} };
      }

      // No response at all → server is genuinely unreachable
      throw new InternalServerErrorException(`AI Builder /ready failed: ${err.message}`);
    }
  }

  // ── 1. Generate Project ─────────────────────────────────────────────────────

  async generateProject(dto: CreateProjectDto): Promise<ProjectDocument | ChatApiResponse> {
    const { prompt, stack, userId, session_id, output_preference } = dto;

    // ── Step 1: fire POST /chat (Direct) or POST /run (RunPod) ────────────────
    let chatData: ChatApiResponse;
    const chatEndpoint = this.mode === 'runpod' ? '/run' : '/chat';

    try {
      const payload: any = {
        message: prompt,
        ...(stack ? { stack } : {}),
        ...(session_id ? { session_id } : {}),
        ...(output_preference ? { output_preference } : {}),
      };

      // RunPod wraps the payload under `input` and accepts a `policy`
      const body = this.mode === 'runpod'
        ? { input: payload, policy: { ttl: 3600000 } }
        : payload;

      const { data } = await this.http.post<ChatApiResponse>(chatEndpoint, body);
      chatData = this.mode === 'runpod' ? (data as any)?.output ?? data : data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message;
      this.logger.error(`AI Builder ${chatEndpoint} failed: ${msg}`);
      throw new InternalServerErrorException(`AI Builder API error: ${msg}`);
    }

    // Detect async job (either reply_type or job_id present)
    const jobId     = this.mode === 'runpod' ? (chatData as any).id : chatData.job_id;
    const sessionId = this.mode === 'runpod' ? ((chatData as any).output?.session_id ?? (chatData as any).id) : chatData.session_id;

    if (!sessionId) {
      throw new InternalServerErrorException('AI Builder did not return a session_id');
    }

    if (chatData.reply_type === 'chat') {
      return chatData;
    }

    // ── Step 2: persist skeleton project ─────────────────────────────────────
    const project = await this.projectModel.create({
      sessionId,
      jobId:     jobId ?? null,
      status:    jobId ? ProjectStatus.BUILDING : ProjectStatus.BUILDING,
      stack:     stack ?? '',
      userId:    userId ?? null,
    });

    this.logger.log(`Project created [${project._id}] | job=${jobId} | session=${sessionId}`);

    // ── Step 3: background polling (non-blocking) if a jobId was returned ─────
    if (jobId) {
      this.pollAndFinalize(project._id.toString(), jobId).catch((err) =>
        this.logger.error(`Background polling failed for project ${project._id}: ${err.message}`),
      );
    }

    return project;
  }

  // ── 2. Polling Logic ────────────────────────────────────────────────────────

  async pollAndFinalize(projectId: string, jobId: string): Promise<void> {
    let attempts = 0;

    // Endpoint differs by mode
    const pollEndpoint = this.mode === 'runpod'
      ? `/status/${jobId}`
      : `/job/${jobId}`;

    while (attempts < MAX_POLL_ATTEMPTS) {
      await this.sleep(POLL_INTERVAL_MS);
      attempts++;

      let jobData: JobApiResponse;
      try {
        const { data } = await this.http.get<JobApiResponse>(pollEndpoint);
        jobData = data;
      } catch (err) {
        this.logger.warn(`Poll attempt ${attempts} failed for job ${jobId}: ${err.message}`);
        continue; // transient error → retry
      }

      // Normalise status across both modes
      const rawStatus = (jobData.status ?? (jobData as any).state ?? '').toLowerCase();
      this.logger.debug(`Poll [${attempts}/${MAX_POLL_ATTEMPTS}] job=${jobId} status=${rawStatus}`);

      // ── Terminal: failed / error / cancelled ─────────────────────────────────
      if (['failed', 'error', 'cancelled'].includes(rawStatus) || (jobData as any).ok === false) {
        const buildErrors = jobData.build_errors ?? (jobData.error ? [jobData.error] : []);
        this.logger.warn(`Job ${jobId} terminal-failed. Errors: ${buildErrors.join(', ')}`);

        await this.projectModel.findByIdAndUpdate(projectId, {
          status:     ProjectStatus.FAILED,
          buildErrors,
          jobId,
        });
        return;
      }

      // ── Terminal: done / completed ───────────────────────────────────────────
      if (rawStatus === 'done' || rawStatus === 'completed') {
        // ── Unwrap the actual result payload ──
        // RunPod: { status, output: { ok, result: { reply_type, files, preview_url, ... } } }
        // Direct: { status, result: { ... } } or flat
        const outputWrapper = (jobData as any).output ?? {};
        const result = outputWrapper.result        // RunPod: output.result
          ?? jobData.result                         // Direct: top-level result
          ?? outputWrapper                          // Fallback: output itself
          ?? {};

        this.logger.log(`Job ${jobId} reply_type=${result.reply_type} intent=${result.intent} files=${(result.files||[]).length} preview=${result.preview_url ?? 'none'}`);

        // ── Chat reply: no build, just a text response ──────────────────────────
        if (result.reply_type === 'chat' || result.intent === 'general_chat') {
          this.logger.log(`Job ${jobId} → chat reply, storing as message.`);
          await this.projectModel.findByIdAndUpdate(projectId, {
            status:      ProjectStatus.COMPLETED,
            projectName: 'Chat Response',
            jobId,
            buildErrors: [],
            files: [{
              path:     '_chat_reply.md',
              content:  result.reply ?? 'No reply.',
              language: 'markdown',
            }],
          });
          return;
        }

        // ── Build completed: extract all available data ──────────────────────────
        // NOTE: files may be empty [] because AI Builder hosts them via preview_url
        // We still store them if present; otherwise the frontend should show the preview iframe
        const rawFiles = result.files ?? (jobData as any).files ?? [];
        const files: ProjectFile[] = rawFiles.map((f: any) => ({
          path:     f.path,
          content:  f.content,
          language: f.language ?? '',
        }));

        // Resolve project name: check result.project_name, project_id, session_id
        const resolvedName = result.project_name
          ?? (jobData as any).project_name
          ?? result.project_id
          ?? result.name
          ?? (result.session_id && result.session_id !== 'default-session'
               ? `project-${(result.session_id as string).slice(0, 8)}`
               : null)
          ?? `project-${Date.now()}`;

        const resolvedPreview = result.preview_url
          ?? (jobData as any).preview_url
          ?? null;

        const resolvedSessionId = result.session_id && result.session_id !== 'default-session'
          ? result.session_id
          : null;

        const updatePayload: any = {
          status:      ProjectStatus.COMPLETED,
          previewUrl:  resolvedPreview,
          projectName: resolvedName,
          files,
          jobId,
          buildErrors: result.build_errors ?? (jobData as any).build_errors ?? [],
        };

        if (resolvedSessionId) {
          updatePayload.sessionId = resolvedSessionId;
        }

        await this.projectModel.findByIdAndUpdate(projectId, updatePayload);
        this.logger.log(`Project ${projectId} completed. files=${files.length} preview=${resolvedPreview ?? 'none'} name=${resolvedName}`);
        return;
      }

      // Non-terminal → keep polling
    }

    // ── Timed out ─────────────────────────────────────────────────────────────
    this.logger.error(`Polling timed out for job ${jobId} after ${MAX_POLL_ATTEMPTS} attempts`);
    await this.projectModel.findByIdAndUpdate(projectId, {
      status:      ProjectStatus.FAILED,
      buildErrors: ['Build timed out after maximum polling attempts'],
    });
  }

  // ── 3. File Upload ─────────────────────────────────────────────────────────

  /**
   * POST /upload — multipart form. Max 20 MB. Supports images and PDFs.
   * Direct mode only (RunPod proxies to the same underlying service).
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    sessionId?: string,
  ): Promise<any> {
    const maxSize = parseInt(this.config.get<string>('AI_UPLOAD_MAX_SIZE') ?? '20971520', 10);

    if (fileBuffer.byteLength > maxSize) {
      throw new BadRequestException(`File too large. Max allowed size is ${maxSize / 1024 / 1024} MB`);
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(mimeType)) {
      throw new BadRequestException('Unsupported file type. Allowed: images (JPEG, PNG, GIF, WebP) and PDF');
    }

    const form = new FormData();
    form.append('file', fileBuffer, { filename: originalName, contentType: mimeType });
    if (sessionId) form.append('session_id', sessionId);

    try {
      const { data } = await this.http.post('/upload', form, {
        headers: { ...form.getHeaders() },
        maxBodyLength: maxSize + 1024,
      });
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message;
      this.logger.error(`AI Builder /upload failed: ${msg}`);
      throw new InternalServerErrorException(`AI Builder upload error: ${msg}`);
    }
  }

  // ── 4. Retrieve Project ─────────────────────────────────────────────────────

  async findProject(projectId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).lean();
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return project as ProjectDocument;
  }

  // ── 5. Project Retrieval Endpoints (runsync / blocking) ────────────────────

  /**
   * Calls a project retrieval endpoint on the AI Builder API.
   * These are blocking calls (30-90s timeout) that use runsync internally.
   */
  private async callProjectEndpoint(
    sessionId: string,
    projectName: string,
    subPath: string,
    params?: Record<string, string>,
  ): Promise<any> {
    const url = `/project/${sessionId}/${encodeURIComponent(projectName)}/${subPath}`;

    try {
      const { data } = await this.http.get(url, {
        params,
        timeout: 90_000, // up to 90s for blocking calls
        responseType: subPath.includes('.zip') ? 'arraybuffer' : 'json',
      });
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message;
      this.logger.error(`AI Builder project endpoint /${subPath} failed: ${msg}`);
      throw new InternalServerErrorException(`AI Builder error: ${msg}`);
    }
  }

  async getProjectManifest(sessionId: string, projectName: string): Promise<any> {
    return this.callProjectEndpoint(sessionId, projectName, 'manifest');
  }

  async getProjectStatus(sessionId: string, projectName: string): Promise<any> {
    return this.callProjectEndpoint(sessionId, projectName, 'status');
  }

  async getProjectFile(sessionId: string, projectName: string, filePath: string): Promise<any> {
    return this.callProjectEndpoint(sessionId, projectName, 'file', { path: filePath });
  }

  async getDistZip(sessionId: string, projectName: string): Promise<Buffer> {
    return this.callProjectEndpoint(sessionId, projectName, 'dist.zip');
  }

  async getSourceZip(sessionId: string, projectName: string): Promise<Buffer> {
    return this.callProjectEndpoint(sessionId, projectName, 'source.zip');
  }

  async getProjectPreview(sessionId: string, projectName: string): Promise<any> {
    return this.callProjectEndpoint(sessionId, projectName, 'preview');
  }

  // ── 6. Edit Flow ────────────────────────────────────────────────────────────

  async editProject(projectId: string, dto: EditProjectDto): Promise<ProjectDocument | ChatApiResponse> {
    const existing = await this.projectModel.findById(projectId);
    if (!existing) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    let chatData: ChatApiResponse;
    const chatEndpoint = this.mode === 'runpod' ? '/run' : '/chat';

    try {
      const payload: any = {
        message:    dto.prompt,
        session_id: existing.sessionId,
        output_preference: (dto as any).output_preference,
      };
      const body = this.mode === 'runpod'
        ? { input: payload, policy: { ttl: 3600000 } }
        : payload;

      const { data } = await this.http.post<ChatApiResponse>(chatEndpoint, body);
      chatData = this.mode === 'runpod' ? (data as any)?.output ?? data : data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message;
      this.logger.error(`AI Builder ${chatEndpoint} (edit) failed: ${msg}`);
      throw new InternalServerErrorException(`AI Builder API error: ${msg}`);
    }

    if (chatData.reply_type === 'chat') {
      return chatData;
    }

    // Reset document to building state
    existing.status      = ProjectStatus.BUILDING;
    existing.jobId       = this.mode === 'runpod' ? (chatData as any).id : (chatData.job_id ?? null);
    existing.previewUrl  = null;
    existing.files       = [];
    existing.buildErrors = [];
    await existing.save();

    this.logger.log(`Project ${projectId} edit started | new job=${existing.jobId}`);

    if (existing.jobId) {
      this.pollAndFinalize(projectId, existing.jobId).catch((err) =>
        this.logger.error(`Background polling (edit) failed for project ${projectId}: ${err.message}`),
      );
    }

    return existing;
  }

  // ── 7. Reporting ────────────────────────────────────────────────────────────

  async getDeployedProjects(): Promise<any[]> {
    try {
      const results = await this.projectModel.aggregate([
        { $match: { status: ProjectStatus.COMPLETED } },
        {
          $addFields: {
            userIdObj: {
              $cond: {
                if: { $and: [{ $ne: ['$userId', null] }, { $ne: ['$userId', ''] }] },
                then: { $toObjectId: '$userId' },
                else: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userIdObj',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: 0,
            projectId: '$_id',
            projectName: '$projectName',
            templateName: { $literal: 'N/A' }, // Auto-adapted: Templates are not linked to AI projects
            deploymentStatus: '$status',
            deployedAt: '$createdAt',
            aiModelId: '$stack', // Auto-adapted: using stack as the model identifier
            user: {
              $cond: {
                if: { $gt: ['$user', null] },
                then: {
                  id: '$user._id',
                  name: '$user.name',
                  email: '$user.email',
                },
                else: null,
              },
            },
          },
        },
      ]);
      return results;
    } catch (error) {
      this.logger.error(`getDeployedProjects error: ${error.message}`);
      throw new InternalServerErrorException(`Failed to retrieve deployed projects: ${error.message}`);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
