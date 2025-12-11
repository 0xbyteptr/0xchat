"use client";

import { useState, useEffect } from "react";
import {
  connectWallet,
  signMessage,
  formatAddress,
  getConnectedAccounts,
  getStoredWallet,
} from "@/lib/web3-auth";

interface WalletLoginProps {
  onWalletConnect: (address: string) => Promise<boolean>;
  isLoading: boolean;
}

export default function WalletLogin({
  onWalletConnect,
  isLoading,
}: WalletLoginProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  // Check if wallet is already connected
  useEffect(() => {
    const checkWallet = async () => {
      const stored = getStoredWallet();
      if (stored) {
        setAddress(stored);
        return;
      }

      const accounts = await getConnectedAccounts();
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    };

    checkWallet();
  }, []);

  // Listen for wallet changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        setAddress(null);
      }
    };

    window.ethereum?.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError("");

    try {
      const walletAddress = await connectWallet();
      if (!walletAddress) {
        setError("Failed to connect wallet. Make sure MetaMask is installed.");
        setIsConnecting(false);
        return;
      }

      setAddress(walletAddress);

      // Sign message to prove ownership
      const message = `Authenticate to 0xChat\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      const signature = await signMessage(walletAddress, message);

      if (!signature) {
        setError("Failed to sign message. Please try again.");
        setIsConnecting(false);
        return;
      }

      // Send to server for auth
      const success = await onWalletConnect(walletAddress);
      if (!success) {
        setError("Authentication failed. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  if (!address) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleConnect}
          disabled={isConnecting || isLoading}
          className="w-full rounded-lg bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed px-4 py-3 font-bold text-white transition-all duration-200"
        >
          {isConnecting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Connecting Wallet...
            </span>
          ) : (
            "🔗 Connect Wallet"
          )}
        </button>

        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-500/50 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <div className="text-xs text-gray-400 text-center">
          💡 Sign in with your crypto wallet or use username/password
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-700/30 border border-slate-600/30 p-4">
        <p className="text-sm text-gray-400 mb-2">🔐 Connected Wallet</p>
        <p className="font-mono text-white">{formatAddress(address)}</p>
      </div>

      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full rounded-lg bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed px-4 py-3 font-bold text-white transition-all duration-200"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Authenticating...
          </span>
        ) : (
          "✨ Sign In with Wallet"
        )}
      </button>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-500/50 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
          <span>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
}
