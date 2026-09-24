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
import PublicPdfViewer from './pages/PublicPdfViewer';
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
  if (typeof window !== 'undefined') {
    const hash = window.location.hash || '';
    if (hash.includes('verify')) {
      const match = hash.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return <Navigate to={`/pdf/${match[1]}`} replace />;
      }
    }
    const search = window.location.search || '';
    if (search.includes('id=')) {
      const match = search.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return <Navigate to={`/pdf/${match[1]}`} replace />;
      }
    }
  }

  const session = getSession();
  if (!session || !session.token) {
    logout();
    return <Navigate to="/login" replace />;
  }
  const isCapacitor = window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost';
  const lastProject = localStorage.getItem('mts_last_project_id') || '6aa8f92c3bb049cf50fdc6c4';
  if (isCapacitor && lastProject && window.innerWidth < 768) {
    return <Navigate to={'/sheet/' + lastProject + '?field=1'} replace />;
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
          const isPublic = path.startsWith('/sign') || path.startsWith('/engineer') || path.startsWith('/review') || path.startsWith('/site-review') || path.startsWith('/pdf') || path.startsWith('/view') || path.startsWith('/verify') || path.startsWith('/login') || path.startsWith('/download') || path.startsWith('/apps');
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
        {/* ── 1. PUBLIC PORTAL & VERIFIED PDF VIEWER ROUTES ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pdf/:projectId" element={<PublicPdfViewer />} />
        <Route path="/view/:projectId" element={<PublicPdfViewer />} />
        <Route path="/verify/:projectId" element={<PublicPdfViewer />} />
        <Route path="/verify" element={<PublicPdfViewer />} />
        <Route path="/sign/:projectId" element={<ClientSignPortal />} />
        <Route path="/review/:projectId" element={<ClientSignPortal />} />
        <Route path="/engineer/:projectId" element={<SiteEngineerPortal />} />
        <Route path="/site-review/:projectId" element={<SiteEngineerPortal />} />
        <Route path="/construction" element={<UnderConstructionPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/apps" element={<DownloadPage />} />

        {/* ── 2. SOFTWARE OPERATIONAL ADMIN PORTAL ── */}
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
