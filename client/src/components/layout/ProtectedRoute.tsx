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
        className="mx-auto max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950"
      >
        <div className="flex items-center gap-2 text-base font-semibold">
          <ShieldAlert className="h-5 w-5 text-amber-700" aria-hidden="true" />
          <span>403 — Access Restricted</span>
        </div>
        <p className="mt-2 text-sm text-amber-900">
          Your account role does not have permission to view this page.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Return to Explore
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
