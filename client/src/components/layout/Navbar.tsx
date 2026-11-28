import { LogOut, Menu, Moon, Plus, Shield, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    showToast('Signed out of Prompt Hub', 'info');
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `border-b-2 px-2.5 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? 'border-[var(--p-accent)] text-[var(--p-ink)]'
        : 'border-transparent text-[var(--p-muted)] hover:text-[var(--p-ink)]'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--p-hairline)] bg-[var(--p-bg)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-6">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:rounded focus:bg-[var(--p-accent)] focus:px-3 focus:py-1.5 focus:text-xs focus:font-medium focus:text-[var(--p-accent-ink)]"
          >
            Skip to content
          </a>

          <Link
            to="/"
            className="flex items-center gap-2.5 text-base font-medium tracking-tight text-[var(--p-ink)]"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-[var(--p-accent)]"
            >
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M7 9l3 3-3 3M12 15h5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-display text-lg font-medium">Prompt Hub</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-2 md:flex">
            <NavLink to="/" end className={navLinkClass}>
              Explore
            </NavLink>
            <NavLink to="/skills" className={navLinkClass}>
              Curated Skills
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/vault" className={navLinkClass}>
                  My Vault
                </NavLink>
                <NavLink to="/bookmarks" className={navLinkClass}>
                  Bookmarks
                </NavLink>
              </>
            ) : null}
            {isAdmin ? (
              <NavLink to="/admin" className={navLinkClass}>
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  Admin
                </span>
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="btn-tactile inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] text-[var(--p-ink)] hover:border-[var(--p-accent)]"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[var(--p-accent)]" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {isAuthenticated && user ? (
            <>
              <Link
                to="/new"
                className="btn-tactile inline-flex h-10 items-center gap-1.5 rounded-md bg-[var(--p-accent)] px-4 text-sm font-medium text-[var(--p-accent-ink)]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Entry
              </Link>
              <span className="rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--p-ink)]">
                {user.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-tactile inline-flex h-10 items-center gap-1.5 rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] px-3 text-sm font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium text-[var(--p-muted)] hover:text-[var(--p-ink)]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="btn-tactile inline-flex h-10 items-center rounded-md bg-[var(--p-accent)] px-4 text-sm font-medium text-[var(--p-accent-ink)]"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] text-[var(--p-ink)]"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[var(--p-accent)]" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] text-[var(--p-ink)]"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-[var(--p-hairline)] bg-[var(--p-surface)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Explore
            </NavLink>
            <NavLink
              to="/skills"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Curated Skills
            </NavLink>
            {isAuthenticated && user ? (
              <>
                <NavLink
                  to="/vault"
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  My Vault
                </NavLink>
                <NavLink
                  to="/bookmarks"
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  Bookmarks
                </NavLink>
                <NavLink
                  to="/new"
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  New Entry
                </NavLink>
                {isAdmin ? (
                  <NavLink
                    to="/admin"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </NavLink>
                ) : null}
                <div className="mt-2 flex items-center justify-between border-t border-[var(--p-hairline)] pt-3">
                  <span className="font-mono text-xs text-[var(--p-muted)]">
                    Signed in as {user.username}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 py-1.5 text-xs font-medium text-[var(--p-ink)]"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-[var(--p-hairline)] pt-3">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 py-2 text-center text-sm font-medium text-[var(--p-ink)]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md bg-[var(--p-accent)] px-3 py-2 text-center text-sm font-medium text-[var(--p-accent-ink)]"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
