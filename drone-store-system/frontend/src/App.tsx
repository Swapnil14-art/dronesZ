import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLogin } from './pages/AdminLogin';
import { ProtectedAdminDashboard } from './pages/ProtectedAdminDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProtectedRoute fallback={<AdminLogin />}>
        <ProtectedAdminDashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
