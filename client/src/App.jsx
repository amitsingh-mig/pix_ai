import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import AdminDashboard from './pages/AdminDashboard';
import AdminAddUser from './pages/AdminAddUser';

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
    <div className="min-h-screen bg-bg font-sans text-textMain">
      <Navbar />
      <main>
        <Routes>
          {/* Public routes (login only — no register) */}
          <Route path="/login" element={<Login />} />

          {/* Private routes */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />

          {/* Admin-only routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/add-user" element={<AdminRoute><AdminAddUser /></AdminRoute>} />

          {/* Redirect /register to login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  </AuthProvider>
);

export default App;
