import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/App';
import { EmptyState, ErrorState, LoadingSkeleton } from '../src/components/ui/StatusState';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';

function renderWithProviders(initialPath = '/login') {
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

describe('Auth Pages, ProtectedRoute & UI Status Primitives', () => {
  it('shows inline validation errors on empty login submit without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderWithProviders('/login');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('logs in user, persists JWT, and displays username in navbar', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          token: 'jwt-test-token',
          user: {
            id: 2,
            username: 'phananh',
            email: 'phan@prompthub.dev',
            role: 'USER',
            isActive: true,
            createdAt: '2026-11-26T08:00:00.000Z',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    renderWithProviders('/login');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'phan@prompthub.dev');
    await user.type(screen.getByLabelText(/password/i), 'PromptHub123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(localStorage.getItem('prompthub_token')).toBe('jwt-test-token');
    });
    expect(await screen.findByText('phananh')).toBeInTheDocument();
  });

  it('displays server 401 error alert when login fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    renderWithProviders('/login');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'phan@prompthub.dev');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /invalid email or password/i,
    );
  });

  it('validates mismatched passwords and handles 409 EMAIL_TAKEN on registration', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: 'EMAIL_TAKEN',
            message: 'An account with this email already exists',
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    renderWithProviders('/register');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^username$/i), 'phan_dev');
    await user.type(screen.getByLabelText(/^email$/i), 'dab@prompthub.dev');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Mismatch123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/confirm password/i));
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i);
  });

  it('redirects guests to /login and blocks USER accounts from /admin', async () => {
    renderWithProviders('/vault');
    expect(
      await screen.findByRole('heading', { name: /sign in to prompt hub/i }),
    ).toBeInTheDocument();

    localStorage.setItem('prompthub_token', 'user-jwt');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            id: 2,
            username: 'phananh',
            email: 'phan@prompthub.dev',
            role: 'USER',
            isActive: true,
            createdAt: '2026-11-26T08:00:00.000Z',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    renderWithProviders('/admin');
    expect(await screen.findByRole('alert')).toHaveTextContent(/403 — access restricted/i);
  });

  it('shows API Connected status pill on Explore page when health probe returns 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 'ok',
          service: 'prompt-hub-api',
          db: 'connected',
          timestamp: '2026-11-26T14:00:00.000Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    renderWithProviders('/');
    expect(await screen.findByText('API Connected')).toBeInTheDocument();
  });

  it('renders LoadingSkeleton, EmptyState, and triggers ErrorState retry callback', async () => {
    const onRetry = vi.fn();
    render(
      <div>
        <LoadingSkeleton count={2} />
        <EmptyState title="Nothing here" description="Try adding a prompt." />
        <ErrorState message="Network timeout" onRetry={onRetry} />
      </div>,
    );

    expect(
      screen.getByRole('status', { name: /loading content/i }),
    ).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
