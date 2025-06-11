import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast'; // Assuming this path is correct for user-frontend

// Define API base URL - ensure this matches your Flask app's URL
const API_BASE_URL = 'http://127.0.0.1:5000'; // Your Flask backend login endpoint

// Define the localStorage key consistently with Admin-frontend
const AUTH_LOCAL_STORAGE_KEY = 'insightPulseUser';

// User interface matching your backend's /login response
export interface User {
  id: number; // Added 'id' as per backend's updated login response
  username: string;
  name: string;
  email: string;
  department: string;
  role: string; // 'Admin', 'user', etc.
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Add isLoading for initial auth check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initial loading state
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // Basic validation to ensure it's a valid user object
        if (parsedUser.id && parsedUser.username && parsedUser.role) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // If stored data is invalid, clear it
          localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
      }
    }
    setIsLoading(false); // Set loading to false after initial check
  }, []); // Empty dependency array means this runs once on mount

  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Login failed",
          description: errorData.detail || "Invalid username or password",
          variant: "destructive",
        });
        return null;
      }

      const userData: User = await response.json();
      // Ensure the incoming data matches the User interface
      if (userData.id && userData.username && userData.role) {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_LOCAL_STORAGE_KEY, JSON.stringify(userData));

        toast({
          title: "Login successful",
          description: `Welcome back, ${userData.name}`,
        });

        return userData;
      } else {
        toast({
          title: "Login failed",
          description: "Invalid user data received from server.",
          variant: "destructive",
        });
        return null;
      }

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Unable to connect to the server.",
        variant: "destructive",
      });
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
    navigate('/login'); // Redirect to login page on logout
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
