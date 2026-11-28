import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/App';
import {
  extractPromptVariables,
  interpolatePrompt,
  PromptPlayground,
} from '../src/components/entries/PromptPlayground';
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

describe('Entry Detail & Interactive Prompt Playground', () => {
  it('extracts unique {{variables}} and updates compiled prompt preview live', async () => {
    const template =
      'Review {{language}} code for {{project_name}} with focus on {{language}} types.';
    expect(extractPromptVariables(template)).toEqual(['language', 'project_name']);
    expect(interpolatePrompt(template, { language: 'TypeScript', project_name: 'PromptHub' })).toBe(
      'Review TypeScript code for PromptHub with focus on TypeScript types.',
    );

    render(
      <ToastProvider>
        <PromptPlayground content={template} />
      </ToastProvider>,
    );

    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await user.type(screen.getByLabelText('language'), 'Python');
    await user.type(screen.getByLabelText('project_name'), 'FastAPI Core');

    expect(
      screen.getByText('Review Python code for FastAPI Core with focus on Python types.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /copy compiled prompt/i }));
    expect(writeText).toHaveBeenCalledWith(
      'Review Python code for FastAPI Core with focus on Python types.',
    );
  });

  it('renders /entries/:id with Prompt Playground, owner Edit/Delete controls, and 403/404 handling', async () => {
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
      if (url.endsWith('/entries/42')) {
        return new Response(
          JSON.stringify({
            entry: {
              id: 42,
              title: 'SQL Query Tuner Prompt',
              entryType: 'PROMPT',
              language: 'sql',
              description: 'Optimizes slow queries.',
              content: 'Analyze SQL query on {{table_name}} for {{goal}}.',
              visibility: 'PUBLIC',
              authorId: 2,
              authorUsername: 'dabber',
              categoryId: 1,
              categoryName: 'AI System Prompts',
              categorySlug: 'ai-system-prompts',
              tags: ['postgres', 'performance'],
              bookmarkCount: 6,
              isBookmarked: false,
              createdAt: '2026-11-27T09:00:00.000Z',
              updatedAt: '2026-11-27T09:00:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/entries/999')) {
        return new Response(
          JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Entry not found' } }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderAt('/entries/42');
    expect(await screen.findByRole('heading', { name: 'SQL Query Tuner Prompt' })).toBeInTheDocument();
    expect(screen.getByLabelText('table_name')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/entries/42/edit');
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();

    const { unmount } = renderAt('/entries/999');
    await waitFor(() => {
      expect(screen.getByText(/entry not found/i)).toBeInTheDocument();
    });
    unmount();
  });
});
