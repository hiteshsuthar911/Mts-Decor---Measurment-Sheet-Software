import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import ProjectsPage from './pages/ProjectsPage';
import MeasurementSheet from './pages/MeasurementSheet';
import ProfilePage from './pages/ProfilePage';
import { getSession, isLoggedIn } from './utils/auth';

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
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* ADMIN only */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRole="ADMIN">
              <AdminPanel />
            </RoleRoute>
          }
        />

        {/* USER only — Project picker */}
        <Route
          path="/projects"
          element={
            <RoleRoute allowedRole="USER">
              <ProjectsPage />
            </RoleRoute>
          }
        />

        {/* USER only — Measurement sheet (by project ID) */}
        <Route
          path="/sheet/:projectId"
          element={
            <RoleRoute allowedRole="USER">
              <MeasurementSheet />
            </RoleRoute>
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
    </BrowserRouter>
  );
}
