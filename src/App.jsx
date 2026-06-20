import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Students from './pages/Students';
import IssueBook from './pages/IssueBook';
import Returns from './pages/Returns';
import Fines from './pages/Fines';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Invoices from './pages/Invoices';
import Loader from './components/ui/Loader';
import Toast from './components/ui/Toast';
import UpdaterOverlay from './components/ui/UpdaterOverlay';

const App = () => {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return <Loader fullScreen />;
  }

  // Public routes (login / register)
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Private routes – wrapped with Layout
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/students" element={<Students />} />
          <Route path="/issue" element={<IssueBook />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/fines" element={<Fines />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/invoices" element={<Invoices />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
      <UpdaterOverlay />
    </>
  );
};

export default App;
