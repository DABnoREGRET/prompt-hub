export type EntryType = 'SNIPPET' | 'PROMPT';
export type EntryVisibility = 'PUBLIC' | 'PRIVATE';

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
