import { createContext, useContext, useEffect, useState } from "react";

import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  verifyRegistration,
} from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "wholesale-current-auth";

function getInitialSession() {
  if (typeof window === "undefined") {
    return { token: "", user: null };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return { token: "", user: null };
    }

    const parsed = JSON.parse(stored);
    return {
      token: parsed?.token || "",
      user: parsed?.user || null,
    };
  } catch (error) {
    return { token: "", user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getInitialSession);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (session.token && session.user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  async function login(credentials) {
    const data = await loginUser(credentials);
    setSession({
      token: data.token,
      user: data.user,
    });
    return data;
  }

  async function register(payload) {
    return registerUser(payload);
  }

  async function verifyRegisterOtp(payload) {
    const data = await verifyRegistration(payload);
    setSession({
      token: data.token,
      user: data.user,
    });
    return data;
  }

  function logout() {
    setSession({
      token: "",
      user: null,
    });
  }

  return (
    <AuthContext.Provider
      value={{
        token: session.token,
        user: session.user,
        isAuthenticated: Boolean(session.token && session.user),
        login,
        register,
        verifyRegisterOtp,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
