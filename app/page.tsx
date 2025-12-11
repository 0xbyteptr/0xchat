"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/lib/hooks";
import { User } from "@/lib/types";

// Decode JWT payload client-side to restore session user
const decodeUserFromToken = (token: string): User | null => {
  try {
    // Validate token exists and is a string
    if (!token || typeof token !== "string") {
      console.warn("Invalid token: token is empty or not a string");
      return null;
    }

    // Trim whitespace
    const trimmedToken = token.trim();
    
    const parts = trimmedToken.split(".");
    if (parts.length !== 3) {
      console.warn("Invalid token format: expected 3 parts (header.payload.signature), got", parts.length);
      return null;
    }
    
    // Decode payload - add padding if needed for base64
    const payload = JSON.parse(atob(parts[1]));
    console.log("Decoded token payload:", payload);
    
    // Check if we have the required fields
    if (!payload?.id || !payload?.username) {
      console.warn("Missing required fields in token. id:", payload?.id, "username:", payload?.username);
      return null;
    }
    
    // Avatar is optional in the token, but we need to provide a default
    return {
      id: payload.id,
      username: payload.username,
      avatar: payload.avatar || "😸", // Default avatar if not in token
    };
  } catch (err) {
    console.warn("Failed to decode token - clearing invalid token:", err);
    // Clear the invalid token from localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("authToken");
    }
    return null;
  }
};

export default function Home() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const {
    login,
    register,
    isAuthLoading,
    authError,
    setAuthError,
    token,
    loadToken,
  } = useAuth();

  // Load token from localStorage on mount
  useEffect(() => {
    loadToken();
  }, [loadToken]);

  // When token is available, restore user session and redirect to first server
  useEffect(() => {
    if (!token) {
      console.log("No token available");
      return;
    }
    
    console.log("Token available, attempting decode and redirect...");
    const userFromToken = decodeUserFromToken(token);
    if (userFromToken) {
      console.log("User decoded from token:", userFromToken);
      setCurrentUser(userFromToken);
      // Add a small delay to ensure state is updated
      const timeout = setTimeout(() => {
        console.log("Redirecting to /servers");
        router.push("/servers");
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      console.error("Failed to decode user from token - userFromToken is null");
    }
  }, [token, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    let user: User | null = null;

    if (isRegistering) {
      user = await register(username, password);
    } else {
      user = await login(username, password);
    }

    if (user) {
      setCurrentUser(user);
      setUsername("");
      setPassword("");
      // The useAuth hook's saveToken will trigger the token state update,
      // which will trigger the redirect effect below
    } else {
      // Auth failed, error is already set by useAuth hook
      console.error("Auth failed:", authError);
    }
  };

  const handleWalletAuth = async (address: string): Promise<boolean> => {
    try {
      const message = `Authenticate to 0xChat\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      
      // Import Web3 functions
      const { signMessage } = await import("@/lib/web3-auth");
      const signature = await signMessage(address, message);

      if (!signature) {
        setAuthError("Failed to sign message with wallet");
        return false;
      }

      // Send to Web3 auth endpoint
      const res = await fetch("/api/auth/web3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || "Wallet authentication failed");
        return false;
      }

      if (data.token) {
        localStorage.setItem("authToken", data.token);
        setCurrentUser(data.user);
        return true;
      }

      return false;
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Wallet auth failed"
      );
      return false;
    }
  };

  // Show login form only if no token is present
  return (
    <LoginForm
      isRegistering={isRegistering}
      username={username}
      password={password}
      authError={authError}
      isAuthLoading={isAuthLoading}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleAuth}
      onToggleRegister={() => {
        setIsRegistering(!isRegistering);
        setAuthError("");
      }}
      onWalletAuth={handleWalletAuth}
    />
  );
}
