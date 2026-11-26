import { Code2, LogOut, Menu, Plus, Shield, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
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
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-semibold text-slate-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
              <Code2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>Prompt Hub</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navLinkClass}>
              Explore
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

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <>
              <Link
                to="/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Entry
              </Link>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {user.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Explore
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
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="text-xs font-medium text-slate-600">
                    Signed in as {user.username}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-center text-sm font-medium text-slate-700"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-center text-sm font-medium text-white"
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
