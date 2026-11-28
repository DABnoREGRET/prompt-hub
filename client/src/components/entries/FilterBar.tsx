import { RotateCcw, Search, X } from 'lucide-react';
import type { CategoryItem, EntrySortBy, EntryType } from '../../types/entry';

const LANGUAGE_OPTIONS = [
  'typescript',
  'javascript',
  'python',
  'sql',
  'bash',
  'dockerfile',
  'yaml',
  'markdown',
  'json',
] as const;

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedType: EntryType | '';
  onTypeChange: (type: EntryType | '') => void;
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  selectedTag: string;
  onClearTag: () => void;
  sortBy: EntrySortBy;
  onSortChange: (sortBy: EntrySortBy) => void;
  categories: CategoryItem[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  selectedLanguage,
  onLanguageChange,
  selectedTag,
  onClearTag,
  sortBy,
  onSortChange,
  categories,
  hasActiveFilters,
  onResetFilters,
}: FilterBarProps) {
  return (
    <section
      aria-label="Search and filters"
      className="space-y-4 rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--p-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search snippets and prompts"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search snippets, prompts, SKILL.md, or tags..."
            className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] py-2 pl-9 pr-3 text-sm text-[var(--p-ink)] placeholder:text-[var(--p-muted)] focus:border-[var(--p-accent)] focus:outline-none"
          />
        </div>

        <div
          role="group"
          aria-label="Entry type filter"
          className="flex flex-wrap items-center gap-1 rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] p-1 lg:col-span-4"
        >
          {(
            [
              { label: 'All Types', value: '' },
              { label: 'Snippets', value: 'SNIPPET' },
              { label: 'Prompts', value: 'PROMPT' },
              { label: 'Skills', value: 'SKILL' },
            ] as const
          ).map((option) => {
            const active = selectedType === option.value;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={active}
                onClick={() => onTypeChange(option.value)}
                className={`flex-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[var(--p-accent)] text-[var(--p-accent-ink)]'
                    : 'text-[var(--p-muted)] hover:bg-[var(--p-surface)] hover:text-[var(--p-ink)]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          <select
            aria-label="Filter by language"
            value={selectedLanguage}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
          >
            <option value="">All Languages</option>
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            aria-label="Sort entries"
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as EntrySortBy)}
            className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Bookmarked</option>
            <option value="title">Title (A–Z)</option>
          </select>
        </div>
      </div>

      {categories.length > 0 || selectedTag || hasActiveFilters ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--p-hairline)] pt-3">
          {categories.length > 0 ? (
            <div aria-label="Categories" className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={selectedCategory === ''}
                onClick={() => onCategoryChange('')}
                className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === ''
                    ? 'border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-ink)]'
                    : 'border-[var(--p-hairline)] bg-[var(--p-bg)] text-[var(--p-ink)] hover:border-[var(--p-accent)]'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => {
                const active = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onCategoryChange(active ? '' : cat.slug)}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-ink)]'
                        : 'border-[var(--p-hairline)] bg-[var(--p-bg)] text-[var(--p-ink)] hover:border-[var(--p-accent)]'
                    }`}
                  >
                    {cat.name} ({cat.entryCount})
                  </button>
                );
              })}
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {selectedTag ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 font-mono text-xs font-medium text-[var(--p-ink)]">
                Tag: {selectedTag}
                <button
                  type="button"
                  onClick={onClearTag}
                  aria-label={`Clear tag filter ${selectedTag}`}
                  className="rounded p-0.5 hover:bg-sky-500/20"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ) : null}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="btn-tactile inline-flex items-center gap-1 rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Clear Filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
