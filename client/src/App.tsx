import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { EmptyState } from './components/ui/StatusState';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ExploreShellPage } from './pages/ExploreShellPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';

export function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<ExploreShellPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/vault"
          element={
            <ProtectedRoute>
              <EmptyState
                title="My Vault"
                description="Your personal snippet and prompt workspace will populate once entries endpoints connect."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <EmptyState
                title="Bookmarks"
                description="Saved public snippets and prompts will appear here."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new"
          element={
            <ProtectedRoute>
              <EmptyState
                title="New Entry"
                description="Snippet and prompt creation form is scheduled for the entries milestone."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <EmptyState
                title="Admin Console"
                description="Category management and user moderation controls."
              />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}
