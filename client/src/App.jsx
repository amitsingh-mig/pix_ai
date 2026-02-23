import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlbumProvider } from './context/AlbumContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import AdminDashboard from './pages/AdminDashboard';
import AdminAddUser from './pages/AdminAddUser';
import Error404 from './pages/Error404';
import Error400 from './pages/Error400';
import Error500 from './pages/Error500';
import Profile from './pages/Profile';
import Loader3D from './components/Loader3D';
import OnboardingTour from './components/OnboardingTour';

// Only show loader once per browser session
const shouldShowLoader = () => !sessionStorage.getItem('loaderShown');

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user && user.role === 'admin' ? children : <Navigate to="/" replace />;
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

        {/* Main app — visible once loader completes */}
        <div
          className="flex flex-col min-h-screen bg-bg font-sans text-textMain"
          style={{
            opacity: loaderDone ? 1 : 0,
            transition: 'opacity 0.5s ease',
            pointerEvents: loaderDone ? 'auto' : 'none',
          }}
        >
          <Navbar />
          <main className="flex-grow flex flex-col">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Private routes */}
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

              {/* Admin-only routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/add-user" element={<AdminRoute><AdminAddUser /></AdminRoute>} />

              {/* Error pages */}
              <Route path="/400" element={<Error400 />} />
              <Route path="/500" element={<Error500 />} />
              <Route path="/404" element={<Error404 />} />

              {/* Redirect /register to login */}
              <Route path="/register" element={<Navigate to="/login" replace />} />

              {/* Catch-all 404 */}
              <Route path="*" element={<Error404 />} />
            </Routes>
          </main>
          <OnboardingTour />
        </div>
      </AlbumProvider>
    </AuthProvider>
  );
};

export default App;
