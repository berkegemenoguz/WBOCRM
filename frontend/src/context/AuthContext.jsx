import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef(null);

  const doLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const resetTimer = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(doLogout, IDLE_TIMEOUT_MS);
  }, [doLogout]);

  // Start/stop idle watcher based on auth state
  useEffect(() => {
    if (!user) {
      clearTimeout(idleTimer.current);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
      return;
    }
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(idleTimer.current);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user, resetTimer]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        setUser(jwtDecode(token));
      } catch {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  function login(token) {
    localStorage.setItem('token', token);
    setUser(jwtDecode(token));
  }

  function logout() {
    doLogout();
  }

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
