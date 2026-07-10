import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "fixhire_token";
const USER_KEY = "fixhire_user";

function readCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(userData) {
  if (userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readCachedUser());
  // loading is true while we verify the token on application load.
  // This prevents the UI from flickering or redirecting authenticated users to the login screen.
  const [loading, setLoading] = useState(true);

  // Re-hydrate auth state when the app mounts.
  // Prefer a cached user for instant UI, then revalidate with /auth/me.
  // Retries on network/cold-start failures so a sleeping Render instance does not
  // wipe a still-valid session. Only clear the token on real auth failures (401).
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setUser(null);
        writeCachedUser(null);
        setLoading(false);
        return;
      }

      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
          writeCachedUser(userData);
          break;
        } catch (err) {
          const isUnauthorized = err?.status === 401;
          const isNetworkError = err?.isNetworkError || err?.status === 0;

          if (isUnauthorized) {
            console.error("Session expired or invalid — clearing token.");
            localStorage.removeItem(TOKEN_KEY);
            writeCachedUser(null);
            setUser(null);
            break;
          }

          if (isNetworkError && attempt < maxAttempts) {
            // Render free tier can take 30–60s to wake; wait and retry.
            console.warn(`Session restore attempt ${attempt} failed (server waking up). Retrying...`);
            await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
            continue;
          }

          // Keep token + cached user on transient failures so refresh does not force logout.
          console.error("Failed to restore session (token kept):", err);
          if (!readCachedUser()) {
            // No cache to fall back on — stay logged out in UI, but keep token for next try.
            setUser(null);
          }
          break;
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
      localStorage.setItem(TOKEN_KEY, data.access_token);

      const userData = {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      };
      setUser(userData);
      writeCachedUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleToken = async (token) => {
    setLoading(true);
    try {
      localStorage.setItem(TOKEN_KEY, token);
      const userData = await api.auth.getMe();
      setUser(userData);
      writeCachedUser(userData);
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
    localStorage.removeItem(TOKEN_KEY);
    writeCachedUser(null);
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
