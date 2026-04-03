import { useState, useEffect, createContext, useContext } from 'react';
import api from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (token) => {
    try {
      const response = await api.get('/api/auth/profile');
      setUser({ ...response.data, token });
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, ...userData } = response.data;
    localStorage.setItem('token', token);
    setUser({ ...userData, token });
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/api/auth/register', { name, email, password });
    const { token, ...userData } = response.data;
    localStorage.setItem('token', token);
    setUser({ ...userData, token });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const response = await api.put('/api/auth/profile', profileData);
    setUser({ ...response.data, token: localStorage.getItem('token') });
    return response.data;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
