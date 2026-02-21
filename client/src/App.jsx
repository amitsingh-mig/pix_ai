import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import AdminDashboard from './pages/AdminDashboard';
import AdminAddUser from './pages/AdminAddUser';
import Error404 from './pages/Error404';
import Error400 from './pages/Error400';
import Error500 from './pages/Error500';

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

const App = () => (
  <AuthProvider>
    <div className="flex flex-col min-h-screen bg-bg font-sans text-textMain">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Private routes */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />

          {/* Admin-only routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/add-user" element={<AdminRoute><AdminAddUser /></AdminRoute>} />

          {/* Error pages for testing */}
          <Route path="/400" element={<Error400 />} />
          <Route path="/500" element={<Error500 />} />
          <Route path="/404" element={<Error404 />} />

          {/* Redirect /register to login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Catch-all 404 route */}
          <Route path="*" element={<Error404 />} />
        </Routes>
      </main>
    </div>
  </AuthProvider>
);

export default App;
