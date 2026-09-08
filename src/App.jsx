import React, { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DownloadPage from './pages/DownloadPage';
import AdminPanel from './pages/AdminPanel';
import ProjectsPage from './pages/ProjectsPage';
import MeasurementSheet from './pages/MeasurementSheet';
import ProfilePage from './pages/ProfilePage';
import UnderConstructionPage from './pages/UnderConstructionPage';
import { getSession, isLoggedIn } from './utils/auth';

const isFileProtocol = typeof window !== 'undefined' && (window.location.protocol === 'file:' || window.isElectron);
const Router = isFileProtocol ? HashRouter : BrowserRouter;

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function AuthRoute({ children }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ children, allowedRole }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== allowedRole) {
    // Redirect to the correct home for their role
    return <Navigate to={session.role === 'ADMIN' ? '/admin' : '/projects'} replace />;
  }
  return children;
}

function DefaultRedirect() {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={session.role === 'ADMIN' ? '/admin' : '/projects'} replace />;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/c/:companySlug" element={<UnderConstructionPage />} />
        <Route path="/construction" element={<UnderConstructionPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/apps" element={<DownloadPage />} />

        {/* ADMIN only */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRole="ADMIN">
              <AdminPanel />
            </RoleRoute>
          }
        />

        {/* Project picker — Accessible to all logged-in users & admins */}
        <Route
          path="/projects"
          element={
            <AuthRoute>
              <ProjectsPage />
            </AuthRoute>
          }
        />

        {/* Measurement sheet (by project ID) — Accessible to all logged-in users & admins */}
        <Route
          path="/sheet/:projectId"
          element={
            <AuthRoute>
              <MeasurementSheet />
            </AuthRoute>
          }
        />

        {/* Profile page for all authenticated users */}
        <Route
          path="/profile"
          element={
            <AuthRoute>
              <ProfilePage />
            </AuthRoute>
          }
        />

        {/* Default: redirect based on role */}
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </Router>
  );
}
