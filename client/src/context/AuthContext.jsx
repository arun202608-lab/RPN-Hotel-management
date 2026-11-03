import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Read per-tab sessionStorage first to ensure tab session isolation!
  const [admin, setAdmin] = useState(() => {
    try {
      const savedAdmin =
        sessionStorage.getItem("admin_profile") ||
        localStorage.getItem("admin_profile");
      return savedAdmin ? JSON.parse(savedAdmin) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return (
      sessionStorage.getItem("admin_token") ||
      localStorage.getItem("admin_token") ||
      null
    );
  });

  const [loading, setLoading] = useState(true);

  // Synchronize on mount: ensure current tab has its session preserved in sessionStorage
  useEffect(() => {
    const sTok = sessionStorage.getItem("admin_token");
    const lTok = localStorage.getItem("admin_token");
    const sProf = sessionStorage.getItem("admin_profile");
    const lProf = localStorage.getItem("admin_profile");

    if (!sTok && lTok) {
      sessionStorage.setItem("admin_token", lTok);
    }
    if (!sProf && lProf) {
      sessionStorage.setItem("admin_profile", lProf);
    }
  }, []);

  // Verify and refresh profile from server strictly using THIS tab's token
  const checkAuth = useCallback(async () => {
    const currentToken =
      sessionStorage.getItem("admin_token") ||
      localStorage.getItem("admin_token");

    if (!currentToken) {
      setAdmin(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/profile");
      if (response.data && response.data.success) {
        const verifiedAdmin = response.data.data;
        setAdmin(verifiedAdmin);
        // CRITICAL: Save to THIS tab's sessionStorage ONLY! Never overwrite other open tabs!
        sessionStorage.setItem("admin_profile", JSON.stringify(verifiedAdmin));
      }
    } catch (err) {
      console.warn("Session expired or invalid for this tab, logging out:", err.message);
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_profile");
      setAdmin(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler: Locks THIS tab's session to the signed-in user
  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    if (response.data && response.data.success) {
      const { token: receivedToken, admin: receivedAdmin } = response.data;

      // 1. Store in THIS tab's private sessionStorage (isolated per tab in Chrome!)
      sessionStorage.setItem("admin_token", receivedToken);
      sessionStorage.setItem("admin_profile", JSON.stringify(receivedAdmin));

      // 2. Also record in localStorage as fallback
      localStorage.setItem("admin_token", receivedToken);
      localStorage.setItem("admin_profile", JSON.stringify(receivedAdmin));

      setToken(receivedToken);
      setAdmin(receivedAdmin);
      return response.data;
    }
    throw new Error(response.data?.message || "Login failed");
  };

  // Logout handler: Clears this tab's session
  const logout = () => {
    const currentTabToken = sessionStorage.getItem("admin_token");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_profile");

    // Only clear localStorage if it belongs to this tab's session
    if (localStorage.getItem("admin_token") === currentTabToken) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_profile");
    }

    setToken(null);
    setAdmin(null);
  };

  // Update profile
  const updateAdminProfile = async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    if (response.data && response.data.success) {
      const updatedAdmin = response.data.admin;
      setAdmin(updatedAdmin);
      sessionStorage.setItem("admin_profile", JSON.stringify(updatedAdmin));
      if (localStorage.getItem("admin_token") === sessionStorage.getItem("admin_token")) {
        localStorage.setItem("admin_profile", JSON.stringify(updatedAdmin));
      }
      return response.data;
    }
    throw new Error(response.data?.message || "Failed to update profile");
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    const response = await api.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: Boolean(token && admin),
        loading,
        login,
        logout,
        updateAdminProfile,
        changePassword,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

