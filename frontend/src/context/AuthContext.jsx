import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading is true while we verify the token on application load.
  // This prevents the UI from flickering or redirecting authenticated users to the login screen.
  const [loading, setLoading] = useState(true);

  // Re-hydrate auth state when the app mounts.
  // If the user has a token in localStorage, we ask the backend for user details.
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("fixhire_token");
      if (token) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
        } catch (err) {
          console.error("Failed to restore session:", err);
          // Token is expired or invalid, remove it
          localStorage.removeItem("fixhire_token");
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.auth.login(email, password);
      // Save token to localStorage for subsequent API requests
      localStorage.setItem("fixhire_token", data.access_token);
      
      const userData = {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      };
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleToken = async (token) => {
    setLoading(true);
    try {
      localStorage.setItem("fixhire_token", token);
      const userData = await api.auth.getMe();
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName, email, password, role) => {
    setLoading(true);
    try {
      await api.auth.register(fullName, email, password, role);
      // Auto-login the user immediately after registering for a smoother experience
      return await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("fixhire_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithGoogleToken,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume AuthContext cleanly in components.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
