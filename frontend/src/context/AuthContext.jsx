// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
// If your backend uses /api/users/me instead, change this one line:
const ME_ENDPOINT = `${API_BASE}/users/me`;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        try {
          const response = await axios.get(ME_ENDPOINT);
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          setUser(null);
          setToken(null);
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (newToken) => {
    localStorage.setItem("token", newToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    try {
      const response = await axios.get(ME_ENDPOINT);
      setUser(response.data);
      setToken(newToken);
      return response.data;
    } catch (error) {
      logout();
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
