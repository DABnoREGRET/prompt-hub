import type { HealthResponse } from '../types/api';
import type { AuthResponse, MeResponse } from '../types/auth';
import { apiRequest } from './client';

export function registerApi(payload: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginApi(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logoutApi(): Promise<{ loggedOut: boolean }> {
  return apiRequest<{ loggedOut: boolean }>('/auth/logout', {
    method: 'POST',
  });
}

export function meApi(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me');
}

export function healthApi(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health');
}
