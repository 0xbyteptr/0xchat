"use client";

import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import { getApiUrl } from "@/lib/api";

export default function LoginPage() {
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
  } = useAuth();

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
      // Redirect after successful auth
      setTimeout(() => {
        router.push("/servers");
      }, 100);
    } else {
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
      const res = await fetch(getApiUrl("/api/auth/web3"), {
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
        setTimeout(() => {
          router.push("/servers");
        }, 100);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
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
    </div>
  );
}
