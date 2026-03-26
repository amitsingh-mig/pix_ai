import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlbumProvider } from './context/AlbumContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import AdminDashboard from './pages/AdminDashboard';
import AdminAddUser from './pages/AdminAddUser';
import GuestGallery from './pages/GuestGallery';
import Error404 from './pages/Error404';
import Error400 from './pages/Error400';
import Error500 from './pages/Error500';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Loader3D from './components/Loader3D';
import OnboardingTour from './components/OnboardingTour';
import MainLayout from './components/MainLayout';

// Only show loader once per browser session
const shouldShowLoader = () => !sessionStorage.getItem('loaderShown');

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

// Require login
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? (children || <Outlet />) : <Navigate to="/login" replace />;
};

// Require admin role
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user && user.role === 'admin' ? (children || <Outlet />) : <Navigate to="/" replace />;
};

// If already logged in, redirect away from /gallery to the proper dashboard
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  // Logged-in users don't need the guest gallery — send them to dashboard
  return !user ? (children || <Outlet />) : <Navigate to="/" replace />;
};

const App = () => {
  const [loaderDone, setLoaderDone] = useState(!shouldShowLoader());

  const handleLoaderComplete = () => {
    sessionStorage.setItem('loaderShown', 'true');
    setLoaderDone(true);
  };

  return (
    <AuthProvider>
      <AlbumProvider>
        {/* 3D Loader — renders on top; fades out via framer-motion */}
        {!loaderDone && <Loader3D onComplete={handleLoaderComplete} />}

        {/* Global Layout logic */}
        <div
          className="min-h-screen bg-bg font-sans text-textMain transition-opacity duration-500"
          style={{
            opacity: loaderDone ? 1 : 0,
            pointerEvents: loaderDone ? 'auto' : 'none',
          }}
        >
          <Routes>
            {/* ── Public / Auth routes ─────────────────────────────────── */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* ── Guest-only public gallery (no login required) ─────────── */}
            <Route path="/gallery" element={<GuestGallery />} />

            {/* ── Authenticated routes wrapped in MainLayout ────────────── */}
            <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin-only routes also inside MainLayout */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/add-user" element={<AdminAddUser />} />
              </Route>
            </Route>

            {/* ── Error pages & Catch-all ───────────────────────────────── */}
            <Route path="/400" element={<Error400 />} />
            <Route path="/500" element={<Error500 />} />
            <Route path="/404" element={<Error404 />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Error404 />} />
          </Routes>

          <OnboardingTour />
        </div>
      </AlbumProvider>
    </AuthProvider>
  );
};

export default App;
