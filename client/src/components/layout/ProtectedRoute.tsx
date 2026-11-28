import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';
import { LoadingSkeleton } from '../ui/StatusState';

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSkeleton count={3} />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-lg rounded-md border border-amber-500/40 bg-amber-500/15 p-6 text-[var(--p-ink)]"
      >
        <div className="flex items-center gap-2 font-display text-base font-medium">
          <ShieldAlert className="h-5 w-5 text-amber-500" aria-hidden="true" />
          <span>403 — Access Restricted</span>
        </div>
        <p className="mt-2 text-sm text-[var(--p-muted)]">
          Your account role does not have permission to view this page.
        </p>
        <Link
          to="/"
          className="btn-tactile mt-4 inline-block rounded-md bg-[var(--p-accent)] px-3.5 py-2 text-sm font-medium text-[var(--p-accent-ink)]"
        >
          Return to Explore
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
