"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useServers } from "@/lib/servers";
import CreateServerModal from "@/components/CreateServerModal";

export default function ServersPage() {
  const router = useRouter();
  const { token, loadToken } = useAuth();
  const { listServers, createServer, isLoading: isServerLoading } = useServers(token);
  const [isLoading, setIsLoading] = useState(true);
  const [hasServers, setHasServers] = useState(false);
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const hasRedirected = useRef(false);

  // Load token on mount
  useEffect(() => {
    console.log("ServersPage mounted, loading token...");
    loadToken();
  }, [loadToken]);

  // Check servers and either redirect or show welcome
  useEffect(() => {
    console.log("Token effect triggered, token:", token ? "exists" : "null");
    
    // Don't proceed if token is null or already redirected
    if (!token || hasRedirected.current) {
      console.log("Skipping redirect: token=" + !!token + ", hasRedirected=" + hasRedirected.current);
      return;
    }

    const checkServers = async () => {
      try {
        console.log("Fetching servers for user...");
        // Add timeout to prevent infinite waiting
        let servers = await Promise.race([
          listServers(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Server fetch timeout")), 15000)
          ),
        ]);
        console.log("Servers fetched:", servers.length);
        
        // If user has servers, redirect to first one
        if (servers.length > 0 && servers[0].channels && servers[0].channels.length > 0) {
          console.log("Redirecting to server:", servers[0].id, "channel:", servers[0].channels[0].id);
          hasRedirected.current = true;
          router.push(`/servers/${servers[0].id}/${servers[0].channels[0].id}`);
        } else {
          // No servers - show welcome screen
          console.log("No servers available, showing welcome screen");
          setHasServers(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load servers:", error);
        // Show welcome screen on error
        setHasServers(false);
        setIsLoading(false);
      }
    };

    checkServers();
  }, [token, listServers, router]);

  const handleCreateServer = async (name: string, description?: string, icon?: string) => {
    setServerError("");
    try {
      const server = await createServer(name, description, icon);
      if (server) {
        console.log("Server created, redirecting...");
        setIsCreateServerModalOpen(false);
        // Redirect to the new server
        router.push(`/servers/${server.id}/${server.channels[0].id}`);
        return server;
      } else {
        setServerError("Failed to create server");
        return null;
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to create server");
      return null;
    }
  };

  // Show loading state initially
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your servers...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen when no servers exist
  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-slate-900">
      <div className="flex-1 flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-8 px-4">
          <div className="space-y-4">
            <div className="text-8xl animate-bounce mb-4">😻</div>
            <h2 className="text-4xl font-black text-white">
              Welcome to 0xChat
            </h2>
            <p className="text-xl text-gray-400">
              Friendly chat for everyone
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 backdrop-blur">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm text-gray-300">Connect & Chat</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 backdrop-blur">
              <div className="text-3xl mb-2">🎪</div>
              <p className="text-sm text-gray-300">Organize Servers</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 backdrop-blur">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm text-gray-300">Manage Roles</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateServerModalOpen(true)}
            className="px-8 py-4 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-pink-500/50"
          >
            ✨ Create Your First Server
          </button>
        </div>
      </div>

      <CreateServerModal
        isOpen={isCreateServerModalOpen}
        isLoading={isServerLoading}
        serverError={serverError}
        onClose={() => {
          setIsCreateServerModalOpen(false);
          setServerError("");
        }}
        onCreate={handleCreateServer}
        onJoinClick={() => {}}
      />
    </div>
  );
}