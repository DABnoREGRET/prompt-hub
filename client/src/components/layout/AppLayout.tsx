import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--p-bg)] text-[var(--p-ink)] transition-colors duration-200">
      <Navbar />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-10"
      >
        {children}
      </main>
      <footer className="border-t border-[var(--p-hairline)] bg-[var(--p-surface)] py-8 text-xs text-[var(--p-muted)]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-10">
          <div className="flex items-center gap-2.5 text-[var(--p-ink)]">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--p-accent)] font-mono text-[11px] font-medium text-[var(--p-accent-ink)]"
              aria-hidden="true"
            >
              P
            </span>
            <span className="font-display text-sm font-medium">Prompt Hub</span>
            <span className="text-[var(--p-muted)]">
              — Code Snippets, AI Prompts &amp; SKILL.md Vault
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <Link to="/" className="hover:text-[var(--p-ink)] hover:underline">
              Explore Catalog
            </Link>
            <Link to="/skills" className="hover:text-[var(--p-ink)] hover:underline">
              Curated Harness Skills
            </Link>
            <Link to="/vault" className="hover:text-[var(--p-ink)] hover:underline">
              Personal Vault
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
