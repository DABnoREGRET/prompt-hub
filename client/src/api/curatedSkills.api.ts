import type {
  CreateCuratedSkillPayload,
  CuratedSkillItem,
  UpdateCuratedSkillPayload,
} from '../types/curatedSkill';
import { apiRequest } from './client';

export function fetchCuratedSkills(params?: {
  q?: string;
  harness?: string;
  category?: string;
}): Promise<{ skills: CuratedSkillItem[] }> {
  const query = new URLSearchParams();
  if (params?.q?.trim()) query.set('q', params.q.trim());
  if (params?.harness?.trim()) query.set('harness', params.harness.trim());
  if (params?.category?.trim()) query.set('category', params.category.trim());
  const qs = query.toString();
  return apiRequest<{ skills: CuratedSkillItem[] }>(
    qs ? `/curated-skills?${qs}` : '/curated-skills',
  );
}

export function createCuratedSkillApi(
  payload: CreateCuratedSkillPayload,
): Promise<{ skill: CuratedSkillItem }> {
  return apiRequest<{ skill: CuratedSkillItem }>('/curated-skills', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCuratedSkillApi(
  id: number,
  payload: UpdateCuratedSkillPayload,
): Promise<{ skill: CuratedSkillItem }> {
  return apiRequest<{ skill: CuratedSkillItem }>(`/curated-skills/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteCuratedSkillApi(id: number): Promise<void> {
  return apiRequest<void>(`/curated-skills/${id}`, {
    method: 'DELETE',
  });
}
