import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';

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

describe('Explore Catalog & My Vault Feeds', () => {
  it('renders categories and live public snippet/prompt cards on Explore page', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/health')) {
        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'prompt-hub-api',
            db: 'connected',
            timestamp: '2026-11-26T15:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/categories')) {
        return new Response(
          JSON.stringify({
            categories: [
              {
                id: 1,
                name: 'AI System Prompts',
                slug: 'ai-system-prompts',
                description: 'Parameterized prompts',
                entryCount: 5,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/entries')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 2,
                title: 'Senior Code Review Prompt Template',
                entryType: 'PROMPT',
                language: 'markdown',
                description: 'Structured pull request reviewer.',
                content: 'Review {{language}} code for {{project_name}}.',
                visibility: 'PUBLIC',
                authorId: 2,
                authorUsername: 'dabber',
                categoryId: 1,
                categoryName: 'AI System Prompts',
                categorySlug: 'ai-system-prompts',
                tags: ['code-review', 'refactoring'],
                bookmarkCount: 3,
                createdAt: '2026-11-26T10:00:00.000Z',
                updatedAt: '2026-11-26T10:00:00.000Z',
              },
            ],
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

    renderAt('/');

    expect(await screen.findByText('API Connected')).toBeInTheDocument();
    expect(
      await screen.findByText('Senior Code Review Prompt Template'),
    ).toBeInTheDocument();
    expect(screen.getByText(/AI System Prompts \(5\)/i)).toBeInTheDocument();
    expect(screen.getByText('PROMPT')).toBeInTheDocument();
    expect(screen.getByText('#code-review')).toBeInTheDocument();
    expect(screen.getByText('2 vars')).toBeInTheDocument();
  });

  it('shows ErrorState and retries loading public entries on click', async () => {
    let entriesCalls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/health')) {
        return new Response(
          JSON.stringify({ status: 'ok', service: 'prompt-hub-api', db: 'connected', timestamp: '2026-11-26T15:00:00.000Z' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/categories')) {
        return new Response(JSON.stringify({ categories: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      entriesCalls += 1;
      if (entriesCalls === 1) {
        return new Response(
          JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Database unavailable' } }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          data: [
            {
              id: 1,
              title: 'Recovered Snippet',
              entryType: 'SNIPPET',
              language: 'typescript',
              description: 'Recovered after retry',
              content: 'export const ok = true;',
              visibility: 'PUBLIC',
              authorId: 2,
              authorUsername: 'dabber',
              categoryId: null,
              categoryName: null,
              categorySlug: null,
              tags: ['typescript'],
              bookmarkCount: 1,
              createdAt: '2026-11-26T10:00:00.000Z',
              updatedAt: '2026-11-26T10:00:00.000Z',
            },
          ],
          pagination: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    renderAt('/');

    expect(await screen.findByText(/database unavailable/i)).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Recovered Snippet')).toBeInTheDocument();
    await waitFor(() => expect(entriesCalls).toBe(2));
  });

  it('renders both PUBLIC and PRIVATE entries on My Vault page when authenticated', async () => {
    localStorage.setItem('prompthub_token', 'dab-jwt');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/me')) {
        return new Response(
          JSON.stringify({
            user: {
              id: 2,
              username: 'dabber',
              email: 'dab@prompthub.dev',
              role: 'USER',
              isActive: true,
              createdAt: '2026-11-26T08:00:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
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
                content: 'Incident {{incident_id}}',
                visibility: 'PRIVATE',
                authorId: 2,
                authorUsername: 'dabber',
                categoryId: 4,
                categoryName: 'AI System Prompts',
                categorySlug: 'ai-system-prompts',
                tags: ['code-review'],
                bookmarkCount: 0,
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

    renderAt('/vault');

    expect(
      await screen.findByText('Private Incident Postmortem Prompt'),
    ).toBeInTheDocument();
    expect(screen.getByText('PRIVATE')).toBeInTheDocument();
  });
});
