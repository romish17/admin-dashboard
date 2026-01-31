import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

// Layouts
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ScriptsList } from '@/pages/scripts/ScriptsList';
import { ScriptDetail } from '@/pages/scripts/ScriptDetail';
import { ScriptEdit } from '@/pages/scripts/ScriptEdit';
import { TodosList } from '@/pages/todos/TodosList';
import { ProjectsList } from '@/pages/projects/ProjectsList';
import { ProjectDetail } from '@/pages/projects/ProjectDetail';
import { RegistriesList } from '@/pages/registries/RegistriesList';
import { ProceduresList } from '@/pages/procedures/ProceduresList';
import { ZabbixList } from '@/pages/zabbix/ZabbixList';
import { RssFeedsList } from '@/pages/rss/RssFeedsList';
import { FavoritesList } from '@/pages/favorites/FavoritesList';
import { Settings } from '@/pages/settings/Settings';
import { SearchResults } from '@/pages/search/SearchResults';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="search" element={<SearchResults />} />

        {/* Scripts */}
        <Route path="scripts" element={<ScriptsList />} />
        <Route path="scripts/new" element={<ScriptEdit />} />
        <Route path="scripts/:id" element={<ScriptDetail />} />
        <Route path="scripts/:id/edit" element={<ScriptEdit />} />

        {/* Todos */}
        <Route path="todos" element={<TodosList />} />

        {/* Projects */}
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/:id" element={<ProjectDetail />} />

        {/* Registries */}
        <Route path="registries" element={<RegistriesList />} />

        {/* Procedures */}
        <Route path="procedures" element={<ProceduresList />} />

        {/* Zabbix */}
        <Route path="zabbix" element={<ZabbixList />} />

        {/* RSS */}
        <Route path="rss" element={<RssFeedsList />} />

        {/* Favorites */}
        <Route path="favorites" element={<FavoritesList />} />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
