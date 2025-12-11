import { ethers } from "ethers";

/**
 * Web3 Authentication - Sign message with wallet to prove ownership
 * No password needed, just sign a message with your private key
 */

export interface Web3AuthPayload {
  address: string;
  message: string;
  signature: string;
  timestamp: number;
}

export async function getWalletProvider() {
  if (typeof window === "undefined") return null;
  if (!window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Connect to user's wallet (MetaMask, etc)
 */
export async function connectWallet(): Promise<string | null> {
  try {
    const provider = await getWalletProvider();
    if (!provider) return null;

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return address;
  } catch (error) {
    console.error("Wallet connection error:", error);
    return null;
  }
}

/**
 * Get list of connected accounts
 */
export async function getConnectedAccounts(): Promise<string[]> {
  try {
    if (typeof window === "undefined" || !window.ethereum) return [];
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    return accounts || [];
  } catch (error) {
    console.error("Failed to get connected accounts:", error);
    return [];
  }
}

/**
 * Sign a message with the wallet
 */
export async function signMessage(
  address: string,
  message: string
): Promise<string | null> {
  try {
    const provider = await getWalletProvider();
    if (!provider) return null;

    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error("Message signing error:", error);
    return null;
  }
}

/**
 * Create auth payload for server
 */
export async function createWeb3AuthPayload(
  address: string
): Promise<Web3AuthPayload | null> {
  const message = `Sign this message to authenticate to 0xChat\nWallet: ${address}\nTimestamp: ${Date.now()}`;
  const signature = await signMessage(address, message);

  if (!signature) return null;

  return {
    address,
    message,
    signature,
    timestamp: Date.now(),
  };
}

/**
 * Verify signature on client side (for display)
 */
export async function verifySignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Get address from localStorage
 */
export function getStoredWallet(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("walletAddress");
}

/**
 * Store address in localStorage
 */
export function storeWallet(address: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("walletAddress", address);
}

/**
 * Clear stored wallet
 */
export function clearWallet(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("walletAddress");
}
