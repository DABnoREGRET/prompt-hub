import type { ApiErrorBody } from '../types/api';

const TOKEN_STORAGE_KEY = 'prompthub_token';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
).replace(/\/+$/, '');

export const tokenStorage = {
  get(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },
  set(token: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  },
  clear(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, string[] | undefined>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  if (!response) {
    throw new ApiClientError(0, 'NETWORK_ERROR', 'Unable to reach server');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    const errBody = payload as ApiErrorBody | null;
    throw new ApiClientError(
      response.status,
      errBody?.error?.code || 'REQUEST_FAILED',
      errBody?.error?.message || `Request failed with status ${response.status}`,
      errBody?.error?.details,
    );
  }

  return payload as T;
}
