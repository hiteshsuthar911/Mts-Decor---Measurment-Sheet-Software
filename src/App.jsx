import React, { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DownloadPage from './pages/DownloadPage';
import AdminPanel from './pages/AdminPanel';
import ProjectsPage from './pages/ProjectsPage';
import MeasurementSheet from './pages/MeasurementSheet';
import ProfilePage from './pages/ProfilePage';
import UnderConstructionPage from './pages/UnderConstructionPage';
import ClientSignPortal from './pages/ClientSignPortal';
import SiteEngineerPortal from './pages/SiteEngineerPortal';
import { getSession, isLoggedIn, logout } from './utils/auth';
import { api } from './utils/api';

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
  if (!session || !session.token) {
    logout();
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RoleRoute({ children, allowedRole }) {
  const session = getSession();
  if (!session || !session.token) {
    logout();
    return <Navigate to="/login" replace />;
  }
  if (session.role !== allowedRole) {
    // Redirect to the correct home for their role
    return <Navigate to={session.role === 'ADMIN' ? '/admin' : '/projects'} replace />;
  }
  return children;
}

function DefaultRedirect() {
  const session = getSession();
  if (!session || !session.token) {
    logout();
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={session.role === 'ADMIN' ? '/admin' : '/projects'} replace />;
}

export default function App() {
  useEffect(() => {
    const session = getSession();
    if (session?.token) {
      api.get('/auth/verify-token').catch(() => {
        logout();
        if (typeof window !== 'undefined') {
          const path = window.location.pathname || '';
          const isPublic = path.startsWith('/sign') || path.startsWith('/engineer') || path.startsWith('/review') || path.startsWith('/site-review') || path.startsWith('/c/') || path.startsWith('/login') || path.startsWith('/download') || path.startsWith('/apps');
          if (!isPublic) {
            window.location.replace('/login');
          }
        }
      });
    }
  }, []);
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign/:projectId" element={<ClientSignPortal />} />
        <Route path="/review/:projectId" element={<ClientSignPortal />} />
        <Route path="/engineer/:projectId" element={<SiteEngineerPortal />} />
        <Route path="/site-review/:projectId" element={<SiteEngineerPortal />} />
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
