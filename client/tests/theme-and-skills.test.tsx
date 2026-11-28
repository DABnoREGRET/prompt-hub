import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';

const ADMIN_USER = {
  id: 1,
  username: 'admin',
  email: 'admin@prompthub.dev',
  role: 'ADMIN' as const,
  isActive: true,
  createdAt: '2026-11-26T08:00:00.000Z',
};

const REGULAR_USER = {
  id: 3,
  username: 'phananh',
  email: 'phan@prompthub.dev',
  role: 'USER' as const,
  isActive: true,
  createdAt: '2026-11-26T08:00:00.000Z',
};

const CURATED_SAMPLE = [
  {
    id: 1,
    title: 'Anthropic Official Agent Skills',
    slug: 'anthropic-official-agent-skills',
    harness: 'Claude Code',
    category: 'Official Registry',
    description: 'Reference SKILL.md specs and document/frontend builders.',
    repoUrl: 'https://github.com/anthropics/skills',
    docsUrl: 'https://agentskills.io',
    installCommand: 'npx skills add anthropics/skills',
    skillMdContent: '---\nname: skill-creator\ndescription: Build modular SKILL.md packages\n---\n\n1. Define crisp trigger.',
    tags: ['skill-md', 'ai-harness'],
    isFeatured: true,
    createdBy: 1,
    createdAt: '2026-11-28T08:00:00.000Z',
    updatedAt: '2026-11-28T08:00:00.000Z',
  },
  {
    id: 2,
    title: 'Playwright Browser Automation MCP',
    slug: 'playwright-browser-mcp',
    harness: 'MCP / Browser',
    category: 'Testing & Browser QA',
    description: 'Browser inspection and accessibility snapshots.',
    repoUrl: 'https://github.com/microsoft/playwright-mcp',
    docsUrl: '',
    installCommand: 'npx @playwright/mcp@latest',
    skillMdContent: '---\nname: browser-verification\ndescription: Snapshot responsive pages\n---\n\nCheck 390px and 1440px.',
    tags: ['testing', 'ai-harness'],
    isFeatured: true,
    createdBy: 1,
    createdAt: '2026-11-28T08:00:00.000Z',
    updatedAt: '2026-11-28T08:00:00.000Z',
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

describe('Dark Mode Toggle, SKILL.md Copy-Paste & Curated Harness Skills UI', () => {
  it('toggles dark/light studio theme cleanly and persists selection to localStorage', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ status: 'ok', service: 'prompt-hub-api', db: 'connected', timestamp: '2026-11-28T09:00:00.000Z' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    renderAt('/');
    const user = userEvent.setup();

    const toggleBtns = await screen.findAllByRole('button', {
      name: /switch to (light|dark) mode/i,
    });
    const initiallyDark = document.documentElement.classList.contains('dark');

    await user.click(toggleBtns[0]);
    expect(document.documentElement.classList.contains('dark')).toBe(!initiallyDark);
    expect(localStorage.getItem('prompthub_theme')).toBe(initiallyDark ? 'light' : 'dark');
  });

  it('supports SKILL.md authoring template insertion and one-click Copy SKILL.md in detail view', async () => {
    localStorage.setItem('prompthub_token', 'phan-jwt');
    let savedPayload: Record<string, unknown> | null = null;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url.endsWith('/auth/me')) {
        return new Response(JSON.stringify({ user: REGULAR_USER }), {
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
      if (url.endsWith('/entries') && method === 'POST') {
        savedPayload = JSON.parse(String(init?.body ?? '{}'));
        return new Response(
          JSON.stringify({
            entry: {
              id: 88,
              ...(savedPayload ?? {}),
              authorId: 3,
              authorUsername: 'phananh',
              categoryName: 'Agent Skills',
              categorySlug: 'agent-skills',
              bookmarkCount: 0,
              isBookmarked: false,
              createdAt: '2026-11-28T10:00:00.000Z',
              updatedAt: '2026-11-28T10:00:00.000Z',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/entries/88')) {
        return new Response(
          JSON.stringify({
            entry: {
              id: 88,
              title: 'TDD Bugfix SKILL.md',
              entryType: 'SKILL',
              language: 'markdown',
              description: 'Failing test before minimal fix.',
              content:
                '---\nname: tdd-bugfix\ndescription: Reproduce bugs with failing tests first.\n---\n\n1. Write failing test',
              visibility: 'PUBLIC',
              authorId: 3,
              authorUsername: 'phananh',
              categoryId: null,
              categoryName: 'Agent Skills',
              categorySlug: 'agent-skills',
              tags: ['skill-md', 'testing'],
              bookmarkCount: 0,
              isBookmarked: false,
              createdAt: '2026-11-28T10:00:00.000Z',
              updatedAt: '2026-11-28T10:00:00.000Z',
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

    await user.type(await screen.findByLabelText(/^title/i), 'TDD Bugfix SKILL.md');
    await user.selectOptions(screen.getByLabelText(/^entry type/i), 'SKILL');

    await user.click(screen.getByRole('button', { name: /insert skill\.md template/i }));
    const contentArea = screen.getByLabelText(/^content/i) as HTMLTextAreaElement;
    expect(contentArea.value).toContain('name:');
    expect(contentArea.value).toContain('description:');

    await user.click(screen.getByRole('button', { name: /save entry/i }));
    await waitFor(() => {
      expect(savedPayload).toMatchObject({ entryType: 'SKILL' });
    });

    expect(
      await screen.findByRole('button', { name: /copy skill\.md/i }),
    ).toBeInTheDocument();
  });

  it('renders public /skills curated directory with links and allows ADMIN curation in /admin', async () => {
    localStorage.setItem('prompthub_token', 'admin-jwt');
    let skills = [...CURATED_SAMPLE];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url.endsWith('/auth/me')) {
        return new Response(JSON.stringify({ user: ADMIN_USER }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/curated-skills') && method === 'GET') {
        return new Response(JSON.stringify({ skills }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/curated-skills') && method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        const created = {
          id: 99,
          slug: 'new-harness-plugin',
          tags: body.tags ?? [],
          isFeatured: Boolean(body.isFeatured),
          createdBy: 1,
          createdAt: '2026-11-28T12:00:00.000Z',
          updatedAt: '2026-11-28T12:00:00.000Z',
          ...body,
        };
        skills = [created, ...skills];
        return new Response(JSON.stringify({ skill: created }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/curated-skills/2') && method === 'DELETE') {
        skills = skills.filter((s) => s.id !== 2);
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const user = userEvent.setup();
    const { unmount } = renderAt('/skills');

    expect(
      await screen.findByText('Anthropic Official Agent Skills'),
    ).toBeInTheDocument();
    const repoLinks = screen.getAllByRole('link', { name: /repository/i });
    expect(repoLinks[0]).toHaveAttribute('href', 'https://github.com/anthropics/skills');
    expect(repoLinks[0]).toHaveAttribute('target', '_blank');

    // Filter by harness
    await user.click(screen.getByRole('button', { name: 'MCP / Browser' }));
    expect(
      screen.queryByText('Anthropic Official Agent Skills'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Playwright Browser Automation MCP')).toBeInTheDocument();
    unmount();

    // Admin curation page
    renderAt('/admin');
    expect(
      await screen.findByRole('heading', { name: /curated harness skills/i }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/skill title/i), 'OpenHands Coding Skill');
    await user.type(screen.getByLabelText(/target harness/i), 'Universal SKILL.md');
    await user.type(screen.getByLabelText(/category/i), 'Automation');
    await user.type(
      screen.getByLabelText(/repository url/i),
      'https://github.com/All-Hands-AI/OpenHands',
    );
    fireEvent.change(screen.getByLabelText(/skill\.md content/i), {
      target: {
        value: '---\nname: openhands-loop\ndescription: Automated verification harness.\n---\n\nRun checks.',
      },
    });
    await user.click(screen.getByRole('button', { name: /add curated skill/i }));

    expect(await screen.findByText('OpenHands Coding Skill')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /delete playwright browser automation mcp/i }),
    );
    await waitFor(() => {
      expect(
        screen.queryByText('Playwright Browser Automation MCP'),
      ).not.toBeInTheDocument();
    });
  });
});
