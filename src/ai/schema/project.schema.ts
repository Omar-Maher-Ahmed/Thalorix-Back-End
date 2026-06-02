import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// ─── Sub-document: ProjectFile ────────────────────────────────────────────────

export class ProjectFile {
  @ApiProperty({ description: 'Relative file path inside the project', example: 'src/App.tsx' })
  @Prop({ required: true })
  path: string;

  @ApiProperty({ description: 'Raw source content of the file' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ description: 'Detected language / extension', example: 'tsx' })
  @Prop({ default: '' })
  language: string;
}

// ─── Project Status Enum ──────────────────────────────────────────────────────

export enum ProjectStatus {
  BUILDING = 'building',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// ─── Main Schema ──────────────────────────────────────────────────────────────

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true, collection: 'ai_projects' })
export class Project {
  /**
   * Session ID returned by the AI Builder API.
   * Preserved for follow-up edit requests to maintain conversation memory.
   */
  @Prop({ required: true, index: true })
  sessionId: string;

  /**
   * Last known job ID from the AI Builder API.
   * Used for polling the /job/:id endpoint.
   */
  @Prop({ default: null })
  jobId: string | null;

  /** Current build lifecycle state. */
  @Prop({
    type: String,
    enum: Object.values(ProjectStatus),
    default: ProjectStatus.BUILDING,
  })
  status: ProjectStatus;

  /** Live preview URL once the build is complete. */
  @Prop({ default: null })
  previewUrl: string | null;

  /** Generated source files returned by the AI Builder. */
  @Prop({ type: [Object], default: [] })
  files: ProjectFile[];

  /** Technology stack used for generation (e.g. "React 18+ Vite"). */
  @Prop({ default: '' })
  stack: string;

  /**
   * Build errors captured when ok: false or status: failed.
   * Persisted for user-level debugging.
   */
  @Prop({ type: [String], default: [] })
  buildErrors: string[];

  /**
   * Project name returned by the AI Builder API after a successful build.
   * Used as a path segment for /project/:sessionId/:projectName/* endpoints.
   */
  @Prop({ default: null })
  projectName: string | null;

  /** Optional reference to the Thalorix user who owns this project. */
  @Prop({ default: null })
  userId: string | null;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
