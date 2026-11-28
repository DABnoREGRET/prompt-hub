import type {
  BookmarkToggleResponse,
  CategoryItem,
  CreateEntryPayload,
  EntriesQueryParams,
  EntrySummary,
  PaginatedEntriesResponse,
  TagItem,
  UpdateEntryPayload,
} from '../types/entry';
import { apiRequest } from './client';

export function fetchCategories(): Promise<{ categories: CategoryItem[] }> {
  return apiRequest<{ categories: CategoryItem[] }>('/categories');
}

export function fetchTags(): Promise<{ tags: TagItem[] }> {
  return apiRequest<{ tags: TagItem[] }>('/tags');
}

export function fetchPublicEntries(
  paramsOrPage: EntriesQueryParams | number = {},
  legacyPageSize = 12,
): Promise<PaginatedEntriesResponse> {
  const params: EntriesQueryParams =
    typeof paramsOrPage === 'number'
      ? { page: paramsOrPage, pageSize: legacyPageSize }
      : paramsOrPage;

  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 12));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.q && params.q.trim()) query.set('q', params.q.trim());
  if (params.type) query.set('type', params.type);
  if (params.category) query.set('category', params.category);
  if (params.language) query.set('language', params.language);
  if (params.tag) query.set('tag', params.tag);

  return apiRequest<PaginatedEntriesResponse>(`/entries?${query.toString()}`);
}

export function fetchMyEntries(): Promise<{ data: EntrySummary[] }> {
  return apiRequest<{ data: EntrySummary[] }>('/entries/mine');
}

export function fetchEntryById(id: number): Promise<{ entry: EntrySummary }> {
  return apiRequest<{ entry: EntrySummary }>(`/entries/${id}`);
}

export function createEntryApi(
  payload: CreateEntryPayload,
): Promise<{ entry: EntrySummary }> {
  return apiRequest<{ entry: EntrySummary }>('/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateEntryApi(
  id: number,
  payload: UpdateEntryPayload,
): Promise<{ entry: EntrySummary }> {
  return apiRequest<{ entry: EntrySummary }>(`/entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteEntryApi(id: number): Promise<void> {
  return apiRequest<void>(`/entries/${id}`, {
    method: 'DELETE',
  });
}

export function addBookmarkApi(id: number): Promise<BookmarkToggleResponse> {
  return apiRequest<BookmarkToggleResponse>(`/entries/${id}/bookmark`, {
    method: 'POST',
  });
}

export function removeBookmarkApi(id: number): Promise<BookmarkToggleResponse> {
  return apiRequest<BookmarkToggleResponse>(`/entries/${id}/bookmark`, {
    method: 'DELETE',
  });
}

export function fetchBookmarksApi(): Promise<{ data: EntrySummary[] }> {
  return apiRequest<{ data: EntrySummary[] }>('/bookmarks');
}
