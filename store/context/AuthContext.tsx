import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminDto, loginAdmin, fetchAdminProfile } from '../services/api';

interface AuthContextType {
  admin: AdminDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: String) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'drone_admin_jwt_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyStoredToken() {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      if (storedToken) {
        try {
          const profile = await fetchAdminProfile(storedToken);
          setAdmin(profile);
          setToken(storedToken);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setAdmin(null);
        }
      }
      setIsLoading(false);
    }
    verifyStoredToken();
  }, []);

  const login = async (email: string, password: String) => {
    const data = await loginAdmin(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setAdmin(data.admin);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
