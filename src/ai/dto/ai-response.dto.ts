export interface AiBuilderResponseDto {
  ok: boolean;
  reply_type?: string;
  intent?: string;
  reply?: string;
  session_id: string;
  job_id?: string;
  files?: Array<{ path: string; content: string; language?: string }>;
  build_errors?: string[];
  build_duration_seconds?: number;
  message?: string;
}
