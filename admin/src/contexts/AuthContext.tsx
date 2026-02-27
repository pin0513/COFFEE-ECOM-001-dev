import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../config/api';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    const token = localStorage.getItem('admin_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { token, admin } = res.data;
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(admin));
    setUser(admin);
  };

  const signOut = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
