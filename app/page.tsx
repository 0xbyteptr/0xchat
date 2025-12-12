"use client";

import { useState, useEffect, useRef } from "react";
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

    // Trim whitespace and clean up
    const trimmedToken = token.trim();
    
    const parts = trimmedToken.split(".");
    
    if (parts.length !== 3) {
      console.warn("Invalid token format: expected 3 parts, got", parts.length);
      return null;
    }
    
    // Decode payload with proper base64 padding
    let payloadStr = parts[1];
    
    // Replace URL-safe characters and add proper padding
    payloadStr = payloadStr
      .replace(/-/g, '+')  // Replace - with +
      .replace(/_/g, '/'); // Replace _ with /
    
    // Add padding as needed
    switch (payloadStr.length % 4) {
      case 0:
        break;
      case 1:
        console.error("Invalid base64 string length");
        return null;
      case 2:
        payloadStr += '==';
        break;
      case 3:
        payloadStr += '=';
        break;
    }
    
    let decodedStr;
    try {
      decodedStr = atob(payloadStr);
    } catch (decodeError) {
      console.error("Failed to decode base64 payload:", decodeError, "String:", payloadStr);
      return null;
    }
    
    let payload;
    try {
      payload = JSON.parse(decodedStr);
    } catch (parseError) {
      console.error("Failed to parse JSON payload:", parseError);
      return null;
    }
    
    // If we have id and username, return user
    if (payload?.id && payload?.username) {
      return {
        id: payload.id,
        username: payload.username,
        avatar: payload.avatar || "😸",
      };
    }
    
    // If we only have id, create a minimal user object
    if (payload?.id) {
      return {
        id: payload.id,
        username: payload.id,
        avatar: payload.avatar || "😸",
      };
    }
    
    console.warn("Token payload missing id:", payload);
    return null;
  } catch (err) {
    console.error("Unexpected error decoding token:", err);
    // Clear the invalid token from localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("authToken");
    }
    return null;
  }
};

export default function Home() {
  const router = useRouter();
  const hasRedirected = useRef(false);
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
    // Only attempt redirect once
    if (hasRedirected.current) {
      return;
    }

    if (!token) {
      return; // Token still loading
    }
    
    console.log("Token available, attempting decode...");
    const userFromToken = decodeUserFromToken(token);
    if (userFromToken) {
      console.log("User decoded successfully, redirecting...");
      hasRedirected.current = true;
      setCurrentUser(userFromToken);
      router.push("/servers");
    } else {
      console.log("Could not decode token, showing login form");
      hasRedirected.current = true;
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
      const url = getApiUrl("/api/auth/web3");
      console.debug("app/page: fetch web3 auth", url);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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

  // Show loading page if token exists and is being processed
  if (token && hasRedirected.current === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-pink-500 to-purple-600 mb-4">
              0xchat
            </h1>
            <p className="text-slate-400">Welcome back! 😸</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
            <p className="text-slate-300">Preparing your chat...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state during redirect, otherwise show login form
  if (hasRedirected.current && currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

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
