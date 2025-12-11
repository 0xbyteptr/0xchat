"use client";

import { FormEvent } from "react";

interface LoginFormProps {
  isRegistering: boolean;
  username: string;
  password: string;
  authError: string;
  isAuthLoading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onToggleRegister: () => void;
}

export default function LoginForm({
  isRegistering,
  username,
  password,
  authError,
  isAuthLoading,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onToggleRegister,
}: LoginFormProps) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-linear-to-br from-purple-900 via-slate-900 to-slate-950 p-12 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="mb-8 text-7xl animate-bounce">🐱</div>
          <h1 className="text-5xl font-black text-white mb-4">0xChat</h1>
          <p className="text-xl text-purple-200 mb-8">Connect with your purr-fect friends</p>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">💬</div>
              <div>
                <p className="font-semibold text-white">Real-time Messaging</p>
                <p className="text-sm text-purple-300">Chat instantly with your community</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/30 flex items-center justify-center">🎪</div>
              <div>
                <p className="font-semibold text-white">Organize Servers</p>
                <p className="text-sm text-purple-300">Create spaces for every community</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/30 flex items-center justify-center">👥</div>
              <div>
                <p className="font-semibold text-white">Role-Based Access</p>
                <p className="text-sm text-purple-300">Manage permissions with ease</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-slate-900">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-4xl font-bold text-white mb-2">🐱 CatboyChat</h1>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-400 mb-8">
              {isRegistering
                ? "Join the purr-fect community 💕"
                : "Sign in to your account"}
            </p>

            {authError && (
              <div className="mb-6 rounded-lg bg-red-900/30 border border-red-500/50 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
                <span>⚠️</span>
                {authError}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">👤</div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => onUsernameChange(e.target.value)}
                    placeholder="your_catboy_name"
                    className="w-full rounded-lg bg-slate-700/50 border border-slate-600/50 pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    maxLength={20}
                    disabled={isAuthLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">🔐</div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-slate-700/50 border border-slate-600/50 pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    disabled={isAuthLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!username.trim() || !password.trim() || isAuthLoading}
                className="w-full rounded-lg bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed px-4 py-3 font-bold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
              >
                {isAuthLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : isRegistering ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800/50 text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={onToggleRegister}
              className="w-full mt-6 rounded-lg border-2 border-slate-600 hover:border-purple-500 px-4 py-3 font-semibold text-gray-300 hover:text-white transition-all duration-200"
            >
              {isRegistering
                ? "Already have an account? Sign In"
                : "Don't have an account? Register"}
            </button>

            <div className="mt-8 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <p className="text-xs text-gray-400 mb-2 font-semibold">Demo Credentials</p>
              <div className="space-y-1 text-xs text-gray-300">
                <p>Username: <code className="bg-slate-900/50 px-2 py-1 rounded font-mono">demo</code></p>
                <p>Password: <code className="bg-slate-900/50 px-2 py-1 rounded font-mono">password</code></p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            🐾 Made with love for the catboy & catgirl community 🐾
          </p>
        </div>
      </div>
    </div>
  );
}
