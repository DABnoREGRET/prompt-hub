import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';

const DAB_USER = {
  id: 2,
  username: 'dabber',
  email: 'dab@prompthub.dev',
  role: 'USER' as const,
  isActive: true,
  createdAt: '2026-11-26T08:00:00.000Z',
};

const CATEGORIES = [
  {
    id: 1,
    name: 'AI System Prompts',
    slug: 'ai-system-prompts',
    description: 'Prompts',
    entryCount: 4,
  },
  {
    id: 2,
    name: 'Backend TypeScript',
    slug: 'backend-typescript',
    description: 'TS utils',
    entryCount: 5,
  },
];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('Entry Create/Edit Form & My Vault Filtering/Deletion', () => {
  it('validates fields with Zod, adds normalized tags, and submits POST /api/entries', async () => {
    localStorage.setItem('prompthub_token', 'dab-jwt');
    let postBody: Record<string, unknown> | null = null;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url.endsWith('/auth/me')) {
        return new Response(JSON.stringify({ user: DAB_USER }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/categories')) {
        return new Response(JSON.stringify({ categories: CATEGORIES }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/entries') && method === 'POST') {
        postBody = JSON.parse(String(init?.body ?? '{}'));
        return new Response(
          JSON.stringify({
            entry: {
              id: 77,
              ...(postBody ?? {}),
              authorId: 2,
              authorUsername: 'dabber',
              categoryName: 'Backend TypeScript',
              categorySlug: 'backend-typescript',
              bookmarkCount: 0,
              isBookmarked: false,
              createdAt: '2026-11-28T11:30:00.000Z',
              updatedAt: '2026-11-28T11:30:00.000Z',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/entries/77')) {
        return new Response(
          JSON.stringify({
            entry: {
              id: 77,
              title: 'Retry Fetch Helper',
              entryType: 'SNIPPET',
              language: 'typescript',
              description: 'Exponential backoff wrapper',
              content: 'export async function fetchWithRetry(url: string) { return fetch(url); }',
              visibility: 'PRIVATE',
              authorId: 2,
              authorUsername: 'dabber',
              categoryId: 2,
              categoryName: 'Backend TypeScript',
              categorySlug: 'backend-typescript',
              tags: ['fetch-retry', 'typescript'],
              bookmarkCount: 0,
              isBookmarked: false,
              createdAt: '2026-11-28T11:30:00.000Z',
              updatedAt: '2026-11-28T11:30:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderAt('/new');
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { name: /create new entry/i })).toBeInTheDocument();

    // Submit invalid empty form -> inline Zod validation
    await user.click(screen.getByRole('button', { name: /save entry/i }));
    expect(await screen.findByText(/title must be at least 3 characters/i)).toBeInTheDocument();
    expect(postBody).toBeNull();

    // Fill valid fields + add normalized tags
    await user.type(screen.getByLabelText(/^title/i), 'Retry Fetch Helper');
    await user.selectOptions(screen.getByLabelText(/^entry type/i), 'SNIPPET');
    await user.selectOptions(screen.getByLabelText(/^language/i), 'typescript');
    await user.selectOptions(screen.getByLabelText(/^category/i), '2');
    await user.selectOptions(screen.getByLabelText(/^visibility/i), 'PRIVATE');
    await user.type(screen.getByLabelText(/^description/i), 'Exponential backoff wrapper');
    fireEvent.change(screen.getByLabelText(/^content/i), {
      target: {
        value: 'export async function fetchWithRetry(url: string) { return fetch(url); }',
      },
    });

    const tagInput = screen.getByLabelText(/add tags/i);
    await user.type(tagInput, 'Fetch Retry');
    await user.click(screen.getByRole('button', { name: /add tag/i }));
    await user.type(tagInput, 'TypeScript');
    await user.click(screen.getByRole('button', { name: /add tag/i }));

    await user.click(screen.getByRole('button', { name: /save entry/i }));

    await waitFor(() => {
      expect(postBody).not.toBeNull();
    });
    expect(postBody).toMatchObject({
      title: 'Retry Fetch Helper',
      entryType: 'SNIPPET',
      visibility: 'PRIVATE',
      categoryId: 2,
      tags: ['fetch-retry', 'typescript'],
    });
    expect(
      await screen.findByRole('heading', { name: 'Retry Fetch Helper' }),
    ).toBeInTheDocument();
  });

  it('pre-populates /entries/:id/edit and deletes entry from My Vault via modal confirmation', async () => {
    localStorage.setItem('prompthub_token', 'dab-jwt');
    let patched = false;
    let deletedId: number | null = null;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url.endsWith('/auth/me')) {
        return new Response(JSON.stringify({ user: DAB_USER }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/categories')) {
        return new Response(JSON.stringify({ categories: CATEGORIES }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/entries/15') && method === 'GET') {
        return new Response(
          JSON.stringify({
            entry: {
              id: 15,
              title: 'Private Incident Postmortem Prompt',
              entryType: 'PROMPT',
              language: 'markdown',
              description: 'Internal template',
              content: 'Summarize incident {{incident_id}} timeline and root cause.',
              visibility: 'PRIVATE',
              authorId: 2,
              authorUsername: 'dabber',
              categoryId: 1,
              categoryName: 'AI System Prompts',
              categorySlug: 'ai-system-prompts',
              tags: ['incident'],
              bookmarkCount: 0,
              isBookmarked: false,
              createdAt: '2026-11-26T10:00:00.000Z',
              updatedAt: '2026-11-26T10:00:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/entries/15') && method === 'PATCH') {
        patched = true;
        const body = JSON.parse(String(init?.body ?? '{}'));
        return new Response(
          JSON.stringify({
            entry: {
              id: 15,
              ...body,
              authorId: 2,
              authorUsername: 'dabber',
              categoryName: 'AI System Prompts',
              categorySlug: 'ai-system-prompts',
              bookmarkCount: 0,
              isBookmarked: false,
              createdAt: '2026-11-26T10:00:00.000Z',
              updatedAt: '2026-11-28T12:00:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/entries/15') && method === 'DELETE') {
        deletedId = 15;
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/entries/mine')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 15,
                title: 'Private Incident Postmortem Prompt',
                entryType: 'PROMPT',
                language: 'markdown',
                description: 'Internal template',
                content: 'Summarize incident {{incident_id}} timeline.',
                visibility: 'PRIVATE',
                authorId: 2,
                authorUsername: 'dabber',
                categoryId: 1,
                categoryName: 'AI System Prompts',
                categorySlug: 'ai-system-prompts',
                tags: ['incident'],
                bookmarkCount: 0,
                isBookmarked: false,
                createdAt: '2026-11-26T10:00:00.000Z',
                updatedAt: '2026-11-26T10:00:00.000Z',
              },
              {
                id: 16,
                title: 'Public TS Guard',
                entryType: 'SNIPPET',
                language: 'typescript',
                description: 'Runtime guard',
                content: 'export const isNonEmpty = (v: string) => v.length > 0;',
                visibility: 'PUBLIC',
                authorId: 2,
                authorUsername: 'dabber',
                categoryId: 2,
                categoryName: 'Backend TypeScript',
                categorySlug: 'backend-typescript',
                tags: ['typescript'],
                bookmarkCount: 2,
                isBookmarked: false,
                createdAt: '2026-11-26T10:00:00.000Z',
                updatedAt: '2026-11-26T10:00:00.000Z',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const user = userEvent.setup();
    const { unmount } = renderAt('/entries/15/edit');
    const titleInput = await screen.findByLabelText(/^title/i);
    expect(titleInput).toHaveValue('Private Incident Postmortem Prompt');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Incident Postmortem Prompt');
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(patched).toBe(true));
    unmount();

    renderAt('/vault');
    expect(
      await screen.findByText('Private Incident Postmortem Prompt'),
    ).toBeInTheDocument();
    expect(screen.getByText('Public TS Guard')).toBeInTheDocument();

    // Filter to Private only
    await user.click(screen.getByRole('button', { name: /^Private \(1\)$/i }));
    expect(screen.queryByText('Public TS Guard')).not.toBeInTheDocument();
    expect(screen.getByText('Private Incident Postmortem Prompt')).toBeInTheDocument();

    // Delete via confirmation modal
    await user.click(
      screen.getByRole('button', { name: /delete private incident postmortem prompt/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(deletedId).toBe(15));
    await waitFor(() => {
      expect(
        screen.queryByText('Private Incident Postmortem Prompt'),
      ).not.toBeInTheDocument();
    });
  });
});
