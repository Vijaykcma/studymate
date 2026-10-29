import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, adminAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authAPI.getMe();
        if (data.success && data.user) {
          setUser(data.user);
          initSocket();
        }
      } catch (err) {
        // Not authenticated
        setUser(null);
        try {
          localStorage.removeItem('studymate_token');
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);
    if (data.success && data.user) {
      if (data.token) {
        try {
          localStorage.setItem('studymate_token', data.token);
        } catch {}
      }
      setUser(data.user);
      initSocket();
    }
    return data;
  };

  const adminLogin = async (credentials) => {
    const data = await adminAPI.login(credentials);
    if (data.success && data.user) {
      if (data.token) {
        try {
          localStorage.setItem('studymate_token', data.token);
        } catch {}
      }
      setUser(data.user);
      initSocket();
    }
    return data;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    if (data.success && data.user) {
      if (data.token) {
        try {
          localStorage.setItem('studymate_token', data.token);
        } catch {}
      }
      setUser(data.user);
      initSocket();
    }
    return data;
  };

  const verifyEmail = async (verificationData) => {
    const data = await authAPI.verifyEmail(verificationData);
    if (data.success && data.user) {
      if (data.token) {
        try {
          localStorage.setItem('studymate_token', data.token);
        } catch {}
      }
      setUser(data.user);
      initSocket();
    }
    return data;
  };

  const logout = async () => {
    try {
      if (user?.role === 'admin') {
        await adminAPI.logout().catch(() => {});
      }
      await authAPI.logout().catch(() => {});
    } catch (e) {
      // Continue client cleanup even if network fails
    }
    try {
      localStorage.removeItem('studymate_token');
    } catch {}
    setUser(null);
    disconnectSocket();
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        register,
        verifyEmail,
        logout,
        updateUser,
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
