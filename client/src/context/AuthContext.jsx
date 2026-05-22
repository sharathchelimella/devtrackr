/**
 * context/AuthContext.jsx – Global Authentication State
 * Provides user state and auth actions to the entire app.
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../services/api';

// ── Context Creation ─────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Reducer ───────────────────────────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, loading: false, user: action.payload, isAuthenticated: true, error: null };
    case 'AUTH_ERROR':
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true, // Start true to check stored token on mount
  error: null,
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * On mount: check if a JWT exists in localStorage and validate it.
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('devtrackr_token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      try {
        // Set token in axios defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const { data } = await api.get('/api/auth/me');
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      } catch (err) {
        // Token invalid or expired
        localStorage.removeItem('devtrackr_token');
        delete api.defaults.headers.common['Authorization'];
        dispatch({ type: 'LOGOUT' });
      }
    };

    initAuth();
  }, []);

  /**
   * Register a new user.
   */
  const register = useCallback(async (name, email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { data } = await api.post('/api/auth/register', { name, email, password });
      localStorage.setItem('devtrackr_token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, message };
    }
  }, []);

  /**
   * Log in an existing user.
   */
  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('devtrackr_token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, message };
    }
  }, []);

  /**
   * Log out the current user.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('devtrackr_token');
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  }, []);

  /**
   * Update user in context after profile change.
   */
  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /**
   * Log in directly with a JWT token (used after GitHub OAuth callback).
   */
  const loginWithToken = useCallback(async (token) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      localStorage.setItem('devtrackr_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await api.get('/api/auth/me');
      dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      return { success: true };
    } catch (err) {
      localStorage.removeItem('devtrackr_token');
      delete api.defaults.headers.common['Authorization'];
      dispatch({ type: 'LOGOUT' });
      return { success: false };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        loginWithToken,
        logout,
        updateUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Custom Hook ───────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
