import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    localStorage.removeItem('token');
    setUser(null);
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
