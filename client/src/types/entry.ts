export type EntryType = 'SNIPPET' | 'PROMPT' | 'SKILL';
export type EntryVisibility = 'PUBLIC' | 'PRIVATE';
export type EntrySortBy = 'newest' | 'popular' | 'title';

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  entryCount: number;
}

export interface TagItem {
  id: number;
  name: string;
}

export interface EntrySummary {
  id: number;
  title: string;
  entryType: EntryType;
  language: string;
  description: string;
  content: string;
  visibility: EntryVisibility;
  authorId: number;
  authorUsername: string;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags: string[];
  bookmarkCount: number;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEntriesResponse {
  data: EntrySummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface EntriesQueryParams {
  q?: string;
  type?: EntryType;
  category?: string;
  language?: string;
  tag?: string;
  sortBy?: EntrySortBy;
  page?: number;
  pageSize?: number;
}

export interface CreateEntryPayload {
  title: string;
  entryType: EntryType;
  language: string;
  categoryId: number | null;
  description: string;
  content: string;
  visibility: EntryVisibility;
  tags: string[];
}

export type UpdateEntryPayload = Partial<CreateEntryPayload>;

export interface BookmarkToggleResponse {
  bookmarked: boolean;
  bookmarkCount: number;
}
