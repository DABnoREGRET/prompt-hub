import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { EmptyState } from './components/ui/StatusState';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AdminCuratedSkillsPage } from './pages/AdminCuratedSkillsPage';
import { CuratedSkillsPage } from './pages/CuratedSkillsPage';
import { EntryDetailPage } from './pages/EntryDetailPage';
import { EntryFormPage } from './pages/EntryFormPage';
import { ExploreShellPage } from './pages/ExploreShellPage';
import { LoginPage } from './pages/LoginPage';
import { MyVaultPage } from './pages/MyVaultPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';

export function AppRoutes() {
  return (
    <ThemeProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ExploreShellPage />} />
          <Route path="/skills" element={<CuratedSkillsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/entries/:id" element={<EntryDetailPage />} />
          <Route
            path="/vault"
            element={
              <ProtectedRoute>
                <MyVaultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <EmptyState
                  title="Bookmarks"
                  description="Saved public snippets, prompts, and SKILL.md files will appear here."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new"
            element={
              <ProtectedRoute>
                <EntryFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/entries/:id/edit"
            element={
              <ProtectedRoute>
                <EntryFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminCuratedSkillsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </ThemeProvider>
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
