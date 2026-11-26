import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">404</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        The route you requested does not exist in Prompt Hub.
      </p>
      <Link
        to="/"
        className="mt-5 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Back to Explore
      </Link>
    </div>
  );
}
