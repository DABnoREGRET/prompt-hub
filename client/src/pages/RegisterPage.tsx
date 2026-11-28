import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiClientError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerFormSchema } from '../validation/auth.schema';

export function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parsed = registerFormSchema.safeParse({
      username,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        username: flat.username?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
        confirmPassword: flat.confirmPassword?.[0],
      });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await register({
        username: parsed.data.username,
        email: parsed.data.email,
        password: parsed.data.password,
      });
      showToast(`Account created for ${user.username}`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
      } else {
        setServerError('Unable to reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-6 sm:p-8">
      <h1 className="font-display text-2xl font-normal text-[var(--p-ink)]">
        Create your Prompt Hub account
      </h1>
      <p className="mt-1.5 text-sm text-[var(--p-muted)]">
        Save private snippets, portable SKILL.md workflows, and team prompts.
      </p>

      {serverError ? (
        <div
          role="alert"
          className="mt-4 rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-500 dark:text-rose-300"
        >
          {serverError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="register-username"
            className="block text-sm font-medium text-[var(--p-ink)]"
          >
            Username
          </label>
          <input
            id="register-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] placeholder:text-[var(--p-muted)] focus:border-[var(--p-accent)] focus:outline-none"
            placeholder="dev_member"
          />
          {fieldErrors.username ? (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.username}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="block text-sm font-medium text-[var(--p-ink)]"
          >
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] placeholder:text-[var(--p-muted)] focus:border-[var(--p-accent)] focus:outline-none"
            placeholder="you@example.com"
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="block text-sm font-medium text-[var(--p-ink)]"
          >
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] placeholder:text-[var(--p-muted)] focus:border-[var(--p-accent)] focus:outline-none"
            placeholder="Min 8 chars, letters + numbers"
          />
          {fieldErrors.password ? (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="register-confirm-password"
            className="block text-sm font-medium text-[var(--p-ink)]"
          >
            Confirm password
          </label>
          <input
            id="register-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] placeholder:text-[var(--p-muted)] focus:border-[var(--p-accent)] focus:outline-none"
            placeholder="Re-enter password"
          />
          {fieldErrors.confirmPassword ? (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.confirmPassword}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-tactile h-10 w-full rounded-md bg-[var(--p-accent)] px-4 text-sm font-medium text-[var(--p-accent-ink)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--p-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-[var(--p-accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
