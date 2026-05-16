import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { isAuthenticated, setAuth, logout, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token && !user) {
        try {
          const { data } = await authAPI.getProfile();
          setAuth(data, token);
        } catch (error) {
          logout();
          navigate('/login');
        }
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, user, logout };
};