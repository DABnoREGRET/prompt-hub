import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';

const SAMPLE_CATEGORIES = [
  {
    id: 1,
    name: 'AI System Prompts',
    slug: 'ai-system-prompts',
    description: 'Parameterized prompts',
    entryCount: 5,
  },
  {
    id: 2,
    name: 'SQL & Postgres',
    slug: 'sql-postgres',
    description: 'Database queries',
    entryCount: 3,
  },
];

const SAMPLE_ENTRIES = [
  {
    id: 1,
    title: 'Zod Env Parser',
    entryType: 'SNIPPET' as const,
    language: 'typescript',
    description: 'Validates startup environment variables.',
    content: 'export const env = z.object({ PORT: z.coerce.number() });',
    visibility: 'PUBLIC' as const,
    authorId: 2,
    authorUsername: 'dabber',
    categoryId: 2,
    categoryName: 'SQL & Postgres',
    categorySlug: 'sql-postgres',
    tags: ['zod', 'typescript'],
    bookmarkCount: 4,
    isBookmarked: false,
    createdAt: '2026-11-26T10:00:00.000Z',
    updatedAt: '2026-11-26T10:00:00.000Z',
  },
  {
    id: 2,
    title: 'Senior Code Review Prompt Template',
    entryType: 'PROMPT' as const,
    language: 'markdown',
    description: 'Structured pull request reviewer.',
    content: 'Review {{language}} code for {{project_name}}.',
    visibility: 'PUBLIC' as const,
    authorId: 2,
    authorUsername: 'dabber',
    categoryId: 1,
    categoryName: 'AI System Prompts',
    categorySlug: 'ai-system-prompts',
    tags: ['code-review', 'refactoring'],
    bookmarkCount: 9,
    isBookmarked: false,
    createdAt: '2026-11-26T11:00:00.000Z',
    updatedAt: '2026-11-26T11:00:00.000Z',
  },
];

function renderExplore(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('Explore Page Search, Filter, Sort, Pagination & Bookmarks', () => {
  it('syncs debounced search, category, type, language, tag, sort, and resets empty filters', async () => {
    const requestedEntryUrls: string[] = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/health')) {
        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'prompt-hub-api',
            db: 'connected',
            timestamp: '2026-11-28T09:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/categories')) {
        return new Response(JSON.stringify({ categories: SAMPLE_CATEGORIES }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/entries')) {
        requestedEntryUrls.push(url);
        const queryString = url.split('?')[1] ?? '';
        const params = new URLSearchParams(queryString);
        if (params.get('q') === 'nonexistent-xyz') {
          return new Response(
            JSON.stringify({
              data: [],
              pagination: { page: 1, pageSize: 12, total: 0, totalPages: 1 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response(
          JSON.stringify({
            data: SAMPLE_ENTRIES,
            pagination: { page: Number(params.get('page') || 1), pageSize: 12, total: 24, totalPages: 2 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderExplore('/');
    const user = userEvent.setup();

    expect(await screen.findByText('Zod Env Parser')).toBeInTheDocument();

    // Debounced search query
    const searchInput = screen.getByLabelText(/search snippets and prompts/i);
    await user.type(searchInput, 'review');

    await waitFor(() => {
      expect(requestedEntryUrls.some((u) => u.includes('q=review'))).toBe(true);
    });

    // Category pill click
    await user.click(screen.getByRole('button', { name: /AI System Prompts \(5\)/i }));
    await waitFor(() => {
      expect(
        requestedEntryUrls.some((u) => u.includes('category=ai-system-prompts')),
      ).toBe(true);
    });

    // Type filter
    await user.click(screen.getByRole('button', { name: 'Prompts' }));
    await waitFor(() => {
      expect(requestedEntryUrls.some((u) => u.includes('type=PROMPT'))).toBe(true);
    });

    // Language select
    await user.selectOptions(screen.getByLabelText(/filter by language/i), 'typescript');
    await waitFor(() => {
      expect(requestedEntryUrls.some((u) => u.includes('language=typescript'))).toBe(true);
    });

    // Clickable card tag chip
    await user.click(screen.getByRole('button', { name: '#code-review' }));
    await waitFor(() => {
      expect(requestedEntryUrls.some((u) => u.includes('tag=code-review'))).toBe(true);
    });

    // Sort select
    await user.selectOptions(screen.getByLabelText(/sort entries/i), 'popular');
    await waitFor(() => {
      expect(requestedEntryUrls.some((u) => u.includes('sortBy=popular'))).toBe(true);
    });

    // Pagination Next button
    await user.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(requestedEntryUrls.some((u) => u.includes('page=2'))).toBe(true);
    });

    // Empty state + Reset Filters
    fireEvent.change(searchInput, { target: { value: 'nonexistent-xyz' } });
    expect(
      await screen.findByText(/no snippets or prompts match your filters/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset filters/i }));
    expect(await screen.findByText('Zod Env Parser')).toBeInTheDocument();
  });

  it('toggles bookmark optimistically when authenticated', async () => {
    localStorage.setItem('prompthub_token', 'phan-jwt');
    const calls: string[] = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      calls.push(`${method} ${url}`);

      if (url.endsWith('/auth/me')) {
        return new Response(
          JSON.stringify({
            user: {
              id: 3,
              username: 'phananh',
              email: 'phan@prompthub.dev',
              role: 'USER',
              isActive: true,
              createdAt: '2026-11-26T08:00:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/health')) {
        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'prompt-hub-api',
            db: 'connected',
            timestamp: '2026-11-28T09:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/categories')) {
        return new Response(JSON.stringify({ categories: SAMPLE_CATEGORIES }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/entries/1/bookmark') && method === 'POST') {
        return new Response(JSON.stringify({ bookmarked: true, bookmarkCount: 5 }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/entries/1/bookmark') && method === 'DELETE') {
        return new Response(JSON.stringify({ bookmarked: false, bookmarkCount: 4 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/entries')) {
        return new Response(
          JSON.stringify({
            data: [SAMPLE_ENTRIES[0]],
            pagination: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderExplore('/');
    const user = userEvent.setup();

    const addBtn = await screen.findByRole('button', { name: /bookmark zod env parser/i });
    await user.click(addBtn);

    await waitFor(() => {
      expect(calls.some((c) => c.startsWith('POST ') && c.endsWith('/entries/1/bookmark'))).toBe(true);
    });
    const removeBtn = await screen.findByRole('button', {
      name: /remove bookmark for zod env parser/i,
    });
    expect(removeBtn).toHaveAttribute('aria-pressed', 'true');

    await user.click(removeBtn);
    await waitFor(() => {
      expect(
        calls.some((c) => c.startsWith('DELETE ') && c.endsWith('/entries/1/bookmark')),
      ).toBe(true);
    });
  });
});
