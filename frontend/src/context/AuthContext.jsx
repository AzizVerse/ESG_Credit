import { createContext, useContext, useEffect, useState } from "react";

import api from "../api/client";

const AuthContext = createContext(null);
const TOKEN_KEY = "esg_token";
const USER_KEY = "esg_user";

function extractAuthPayload(response) {
  const payload = response?.data?.data || response?.data || {};

  return {
    token: payload.token || "",
    user: payload.user || null,
  };
}

function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const authPayload = extractAuthPayload(response);

    if (!authPayload.token || !authPayload.user) {
      throw new Error(response?.data?.message || "Reponse de connexion invalide");
    }

    setToken(authPayload.token);
    setUser(authPayload.user);

    return authPayload.user;
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: Boolean(token && user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider");
  }

  return context;
}
