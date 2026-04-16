import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, loginUser } from '../services/api';
import { resetUnauthorizedGuard } from '../services/apiClient';

const AuthContext = createContext(null);

const noop = () => {};
const fallbackAuthContext = {
  user: null,
  role: null,
  token: null,
  isAuthenticated: false,
  login: noop,
  logout: noop,
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  // Fail-safe in development/HMR edge-cases where provider can temporarily unmount.
  if (!context) {
    return fallbackAuthContext;
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        if (active) setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        const normalizedRole = String(currentUser.role).toUpperCase();
        const normalizedUser = { ...currentUser, role: normalizedRole };

        if (!active) return;

        setUser(normalizedUser);
        setToken(storedToken);
        setRole(normalizedRole);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('role', normalizedRole);
      } catch {
        if (!active) return;

        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
        setToken(null);
        setRole(null);
        setIsAuthenticated(false);
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginUser(email, password);
    const normalizedRole = String(data.user.role).toUpperCase();
    const normalizedUser = { ...data.user, role: normalizedRole };

    setUser(normalizedUser);
    setToken(data.token);
    setRole(normalizedRole);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', normalizedRole);
    resetUnauthorizedGuard();
    return normalizedUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (!isAuthenticated && window.location.pathname === '/login') {
        return;
      }

      logout();

      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [isAuthenticated, logout, navigate]);

  const authValue = useMemo(
    () => ({ user, role, token, isAuthenticated, login, logout }),
    [isAuthenticated, login, logout, role, token, user]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};
