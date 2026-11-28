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

describe('AI Assistant Panel Integration', () => {
  it('runs AI Suggest Tags & Improve in EntryFormPage and applies suggestions to editor fields', async () => {
    localStorage.setItem('prompthub_token', 'dab-jwt');

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
        return new Response(JSON.stringify({ categories: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/ai/analyze') && method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        if (body.mode === 'suggest-tags') {
          return new Response(
            JSON.stringify({
              analysis: {
                mode: 'suggest-tags',
                source: 'heuristic',
                summary: 'Detected TypeScript schema validation snippet.',
                suggestions: ['Tag with framework and runtime keywords for quick search.'],
                suggestedTags: ['zod', 'express', 'validation'],
                detectedVariables: [],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response(
          JSON.stringify({
            analysis: {
              mode: 'improve',
              source: 'heuristic',
              summary: 'Added explicit JSDoc and stricter return typing.',
              suggestions: ['Add JSDoc header documenting parameters and error behavior.'],
              suggestedTags: ['typescript'],
              improvedContent:
                '/** Safely parses schema input */\nexport const parseSafe = (v: unknown) => v;',
              detectedVariables: [],
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

    render(
      <MemoryRouter initialEntries={['/new']}>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    const contentField = await screen.findByLabelText(/^content/i);
    fireEvent.change(contentField, {
      target: {
        value: 'export const parseSafe = (v: unknown) => v;',
      },
    });

    await user.click(screen.getByRole('button', { name: /suggest tags/i }));

    expect(
      await screen.findByText(/detected typescript schema validation snippet/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /apply suggested tags/i }));

    expect(screen.getByRole('button', { name: /remove tag zod/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove tag express/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^improve$/i }));
    await user.click(await screen.findByRole('button', { name: /apply improved content/i }));

    await waitFor(() => {
      expect(contentField).toHaveValue(
        '/** Safely parses schema input */\nexport const parseSafe = (v: unknown) => v;',
      );
    });
  });
});
