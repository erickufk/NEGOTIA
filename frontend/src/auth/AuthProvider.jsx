import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("negotia_token"));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("negotia_user");
    return u ? JSON.parse(u) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("negotia_token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("negotia_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("negotia_user", JSON.stringify(user));
    else localStorage.removeItem("negotia_user");
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      setToken(data.token); setUser(data.user);
      return true;
    } finally { setLoading(false); }
  };
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
      setToken(data.token); setUser(data.user);
      return true;
    } finally { setLoading(false); }
  };
  const logout = () => { setToken(null); setUser(null); };

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, register, logout, API }}>
      {children}
    </AuthCtx.Provider>
  );
}
export const useAuth = () => useContext(AuthCtx);
