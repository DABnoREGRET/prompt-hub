export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[] | undefined>;
  };
}

export interface HealthResponse {
  status: string;
  service: string;
  db: string;
  timestamp: string;
}
