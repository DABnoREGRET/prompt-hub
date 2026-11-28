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
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="relative lg:col-span-5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search snippets and prompts"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title, code, description, or tag..."
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div
          role="group"
          aria-label="Entry type filter"
          className="flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 lg:col-span-3"
        >
          {(
            [
              { label: 'All Types', value: '' },
              { label: 'Snippets', value: 'SNIPPET' },
              { label: 'Prompts', value: 'PROMPT' },
            ] as const
          ).map((option) => {
            const active = selectedType === option.value;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={active}
                onClick={() => onTypeChange(option.value)}
                className={`flex-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200/70'
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
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Bookmarked</option>
            <option value="title">Title (A–Z)</option>
          </select>
        </div>
      </div>

      {categories.length > 0 || selectedTag || hasActiveFilters ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          {categories.length > 0 ? (
            <div aria-label="Categories" className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={selectedCategory === ''}
                onClick={() => onCategoryChange('')}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === ''
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                Tag: {selectedTag}
                <button
                  type="button"
                  onClick={onClearTag}
                  aria-label={`Clear tag filter ${selectedTag}`}
                  className="rounded-full p-0.5 hover:bg-sky-200/70"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ) : null}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
