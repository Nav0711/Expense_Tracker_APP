import React, { createContext, useContext, useState, useEffect } from 'react';
import { userApi, User } from '@/lib/api';

interface AuthUser extends User {
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, username: string, password: string, allowance?: number) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy credentials for demo
const DUMMY_CREDENTIALS = [
  { username: 'demo', password: 'password', name: 'Demo User', email: 'demo@expense-tracker.com', allowance: 50 },
  { username: 'admin', password: 'admin123', name: 'Admin User', email: 'admin@expense-tracker.com', allowance: 100 },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on app load
    const storedUser = localStorage.getItem('expense-tracker-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Find dummy credentials
      const credentials = DUMMY_CREDENTIALS.find(
        c => c.username === username && c.password === password
      );
      
      if (!credentials) {
        setIsLoading(false);
        return false;
      }

      // Check if user exists in database, if not create them
      const existingUsers = await userApi.list();
      let apiUser = existingUsers.find(u => u.email === credentials.email);
      
      if (!apiUser) {
        // Create user in database
        apiUser = await userApi.create({
          name: credentials.name,
          email: credentials.email,
          allowance: credentials.allowance,
        });
      }

      const userData: AuthUser = {
        ...apiUser,
        username: credentials.username,
      };
      
      setUser(userData);
      localStorage.setItem('expense-tracker-user', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (
    name: string, 
    email: string, 
    username: string, 
    password: string, 
    allowance = 50
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Create user in database
      const apiUser = await userApi.create({
        name,
        email,
        allowance,
      });

      const userData: AuthUser = {
        ...apiUser,
        username,
      };
      
      setUser(userData);
      localStorage.setItem('expense-tracker-user', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('expense-tracker-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};