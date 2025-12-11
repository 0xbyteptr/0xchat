import { useState, useCallback } from "react";
import { User } from "./types";
import { API_ENDPOINTS, ERROR_MESSAGES } from "./constants";

interface AuthResponse {
  success?: boolean;
  user?: User;
  token?: string;
  error?: string;
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  try {
    return { data: JSON.parse(text), raw: text };
  } catch {
    return { data: null, raw: text };
  }
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

export function useAuth() {
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  // Read token from cookie (non-HttpOnly; client-managed)
  const readCookieToken = () => {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("authToken="));
    if (!match) return null;
    return decodeURIComponent(match.split("=")[1]);
  };

  // Load token from localStorage or cookie on mount
  const loadToken = useCallback(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("authToken") || readCookieToken();
      if (storedToken) {
        console.log("Token found in storage, validating...");
        // Validate token by trying a simple API call
        validateToken(storedToken)
          .then((isValid: boolean) => {
            if (isValid) {
              console.log("Token is valid, setting token state");
              setToken(storedToken);
            } else {
              // Token is invalid, clear it
              console.warn("Token validation failed, clearing token");
              setToken(null);
              localStorage.removeItem("authToken");
              document.cookie = "authToken=; path=/; max-age=0;";
            }
          })
          .catch((err) => {
            // On error, clear the token to allow re-login
            console.warn("Token validation error, clearing token:", err);
            setToken(null);
            localStorage.removeItem("authToken");
            document.cookie = "authToken=; path=/; max-age=0;";
          });
      } else {
        console.log("No token found in storage");
        setToken(null);
      }
    }
  }, []);

  // Save token to localStorage and cookie
  const saveToken = useCallback((newToken: string) => {
    console.log("Saving token:", newToken.substring(0, 50) + "...");
    setToken(newToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", newToken);
      document.cookie = `authToken=${encodeURIComponent(newToken)}; path=/; max-age=${7 * 24 * 60 * 60}; sameSite=Lax; secure=${location.protocol === "https:"}`;
      console.log("Token saved to localStorage and cookie");
    }
  }, []);

  // Clear token from localStorage and cookie
  const clearToken = useCallback(() => {
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      document.cookie = "authToken=; path=/; max-age=0;";
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<User | null> => {
      setAuthError("");
      setIsAuthLoading(true);

      if (!username.trim() || !password.trim()) {
        setAuthError(ERROR_MESSAGES.FILL_FIELDS);
        setIsAuthLoading(false);
        return null;
      }

      try {
        const response = await fetch(API_ENDPOINTS.AUTH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "login",
            username: username.trim(),
            password,
          }),
        });
        const { data, raw } = await parseJsonSafe(response);

        if (!response.ok) {
          setAuthError((data as AuthResponse)?.error || raw || ERROR_MESSAGES.INTERNAL_ERROR);
          return null;
        }

        const authData = data as AuthResponse;
        if (!authData?.token) {
          setAuthError("Server error: No token received");
          return null;
        }

        if (!authData.user) {
          setAuthError("Server error: No user data received");
          return null;
        }

        // Save JWT token
        saveToken(authData.token);
        return authData.user;
      } catch (error) {
        console.error("Login error:", error);
        setAuthError(ERROR_MESSAGES.NETWORK_ERROR);
        return null;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [saveToken]
  );

  const register = useCallback(
    async (username: string, password: string): Promise<User | null> => {
      setAuthError("");
      setIsAuthLoading(true);

      if (!username.trim() || !password.trim()) {
        setAuthError(ERROR_MESSAGES.FILL_FIELDS);
        setIsAuthLoading(false);
        return null;
      }

      try {
        const response = await fetch(API_ENDPOINTS.AUTH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register",
            username: username.trim(),
            password,
          }),
        });
        const { data, raw } = await parseJsonSafe(response);

        if (!response.ok) {
          setAuthError((data as AuthResponse)?.error || raw || ERROR_MESSAGES.INTERNAL_ERROR);
          return null;
        }

        const authData = data as AuthResponse;
        if (!authData?.token) {
          setAuthError("Server error: No token received");
          console.error("No token in register response:", authData);
          return null;
        }

        console.log("Register response token:", authData.token.substring(0, 50) + "...");

        if (!authData.user) {
          setAuthError("Server error: No user data received");
          return null;
        }

        // Save JWT token
        saveToken(authData.token);
        return authData.user;
      } catch (error) {
        console.error("Registration error:", error);
        setAuthError(ERROR_MESSAGES.NETWORK_ERROR);
        return null;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [saveToken]
  );

  return {
    login,
    register,
    isAuthLoading,
    authError,
    setAuthError,
    token,
    saveToken,
    clearToken,
    loadToken,
  };
}
