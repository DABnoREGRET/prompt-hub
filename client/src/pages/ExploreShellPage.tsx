import { BookOpen, Sparkles, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ExploreShellPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Snippet &amp; Prompt Workspace
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Explore Reusable Code Snippets &amp; AI Prompts
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Browse community templates, filter by language or category, and run interactive
              {' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                {'{{variable}}'}
              </code>{' '}
              prompts directly in your browser.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {isAuthenticated && user ? (
              <Link
                to="/vault"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Open My Vault
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <Terminal className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">Typed Code Snippets</h2>
          <p className="mt-1 text-sm text-slate-600">
            Store battle-tested TypeScript, SQL, React, and CI snippets with clear language tags.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <Sparkles className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">Prompt Playground</h2>
          <p className="mt-1 text-sm text-slate-600">
            Parameterize reusable AI instructions with live variable substitution before copying.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <BookOpen className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">Public &amp; Private Vaults</h2>
          <p className="mt-1 text-sm text-slate-600">
            Share team standards publicly or keep personal incident and review prompts private.
          </p>
        </div>
      </section>
    </div>
  );
}
