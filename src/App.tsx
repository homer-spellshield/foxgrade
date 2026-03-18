import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicTrustCentre from './pages/PublicTrustCentre';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Onboarding from './pages/admin/Onboarding';
import Documents from './pages/admin/Documents';
import Editor from './pages/admin/Editor';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Auth routes */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          
          {/* Admin Section (Protected) */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="documents" element={<Documents />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="editor" element={<Editor />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Public Trust Centre Viewer */}
          <Route path="/p/:orgId" element={<PublicTrustCentre />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
