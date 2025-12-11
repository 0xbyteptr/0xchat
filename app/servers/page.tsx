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
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const hasRedirected = useRef(false);

  // Load token on mount
  useEffect(() => {
    console.log("ServersPage mounted, loading token...");
    loadToken();
  }, [loadToken]);

  // Check servers on token load
  useEffect(() => {
    if (!token || hasRedirected.current) return;

    const checkServers = async () => {
      hasRedirected.current = true;
      try {
        console.log("Fetching servers for user...");
        let servers = await Promise.race([
          listServers(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Server fetch timeout")), 8000)
          ),
        ]);
        console.log("Servers fetched:", servers.length);
        
        // If user has servers, redirect to first one
        if (servers.length > 0 && servers[0].channels && servers[0].channels.length > 0) {
          console.log("Redirecting to server:", servers[0].id, "channel:", servers[0].channels[0].id);
          router.push(`/servers/${servers[0].id}/${servers[0].channels[0].id}`);
        } else {
          // No servers - redirect to DMs
          console.log("No servers available, redirecting to DMs");
          router.push("/dms");
        }
      } catch (error) {
        console.error("Failed to load servers:", error);
        // Go to DMs on error
        router.push("/dms");
      }
    };

    checkServers();
  }, [token, router]);

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

  // No servers available, redirect to DMs
  // (Already handled in the checkServers effect above)

  // Always show loading state - component redirects immediately or goes to DMs
  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-slate-900 px-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-2 border-purple-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-300 text-sm sm:text-base">Loading...</p>
      </div>
    </div>
  );
}