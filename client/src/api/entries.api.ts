import type {
  CategoryItem,
  EntrySummary,
  PaginatedEntriesResponse,
  TagItem,
} from '../types/entry';
import { apiRequest } from './client';

export function fetchCategories(): Promise<{ categories: CategoryItem[] }> {
  return apiRequest<{ categories: CategoryItem[] }>('/categories');
}

export function fetchTags(): Promise<{ tags: TagItem[] }> {
  return apiRequest<{ tags: TagItem[] }>('/tags');
}

export function fetchPublicEntries(
  page = 1,
  pageSize = 12,
): Promise<PaginatedEntriesResponse> {
  return apiRequest<PaginatedEntriesResponse>(
    `/entries?page=${page}&pageSize=${pageSize}`,
  );
}

export function fetchMyEntries(): Promise<{ data: EntrySummary[] }> {
  return apiRequest<{ data: EntrySummary[] }>('/entries/mine');
}
