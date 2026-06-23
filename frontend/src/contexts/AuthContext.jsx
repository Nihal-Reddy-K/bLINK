import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState('dark'); // Default theme is dark as requested

  useEffect(() => {
    // Check for existing token and user on mount
    const token = localStorage.getItem('blink_token');
    const storedUser = localStorage.getItem('blink_user');
    const storedTheme = localStorage.getItem('blink_theme');

    if (storedTheme) {
      setThemeMode(storedTheme);
    }

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Verify token & fetch fresh profile
        verifyAndFetchUser();
      } catch (e) {
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Sync theme to DOM body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('blink_theme', themeMode);
  }, [themeMode]);

  const verifyAndFetchUser = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        const freshUser = response.data.user;
        setUser(freshUser);
        localStorage.setItem('blink_user', JSON.stringify(freshUser));
      }
    } catch (err) {
      console.error('Failed to verify token:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/users/login', { username, password });
      if (response.data.success) {
        const { token, ...userData } = response.data;
        localStorage.setItem('blink_token', token);
        localStorage.setItem('blink_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid username or password';
      return { success: false, message: msg };
    }
  };

  const register = async (name, username, password, avatar) => {
    try {
      const response = await api.post('/users/register', { name, username, password, avatar });
      if (response.data.success) {
        const { token, ...userData } = response.data;
        localStorage.setItem('blink_token', token);
        localStorage.setItem('blink_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Registration failed' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Username already taken or invalid inputs';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('blink_token');
    localStorage.removeItem('blink_user');
    setUser(null);
  };

  const updateProfile = async (name, avatar) => {
    try {
      const response = await api.put('/users/profile', { name, avatar });
      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem('blink_user', JSON.stringify(updatedUser));
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Update failed' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile';
      return { success: false, message: msg };
    }
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const getProfileStats = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        themeMode,
        login,
        register,
        logout,
        updateProfile,
        toggleTheme,
        getProfileStats
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
