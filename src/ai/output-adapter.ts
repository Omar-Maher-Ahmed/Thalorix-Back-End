// ─── OutputAdapter ────────────────────────────────────────────────────────────
// Standard response envelope used across the Thalorix AI module.
// Every controller response is wrapped by one of these helpers.

export interface OutputAdapter<T = any> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
  buildErrors?: string[];
}

export function successResponse<T>(
  data: T,
  message = 'Success',
): OutputAdapter<T> {
  return { ok: true, data, message };
}

export function errorResponse(
  error: string,
  buildErrors: string[] = [],
): OutputAdapter<never> {
  return { ok: false, error, buildErrors };
}
