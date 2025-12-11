"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useServers } from "@/lib/servers";

export default function ServersPage() {
  const router = useRouter();
  const { token, loadToken } = useAuth();
  const { listServers } = useServers(token);
  const [isLoading, setIsLoading] = useState(true);
  const hasRedirected = useRef(false);

  // Load token on mount
  useEffect(() => {
    console.log("ServersPage mounted, loading token...");
    loadToken();
  }, [loadToken]);

  // Redirect to first server once token is loaded
  useEffect(() => {
    console.log("Token effect triggered, token:", token ? "exists" : "null");
    
    // Don't proceed if token is null or already redirected
    if (!token || hasRedirected.current) {
      console.log("Skipping redirect: token=" + !!token + ", hasRedirected=" + hasRedirected.current);
      return;
    }

    const redirectToFirstServer = async () => {
      try {
        console.log("Fetching servers for user...");
        let servers = await listServers();
        console.log("Servers fetched:", servers.length);
        
        // If no servers, create a default one
        if (servers.length === 0) {
          console.log("No servers found, creating default server...");
          try {
            const response = await fetch("/api/servers", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                action: "create",
                name: "My First Server",
                description: "Welcome to CatboyChat! 🐱",
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log("Server created:", data.server?.id);
              if (data.server) {
                servers = [data.server];
              }
            } else {
              console.error("Failed to create server, status:", response.status);
            }
          } catch (error) {
            console.error("Failed to create default server:", error);
          }
        }

        // Now redirect to first server if we have one
        if (servers.length > 0) {
          console.log("Redirecting to server:", servers[0].id, "channel:", servers[0].channels[0].id);
          hasRedirected.current = true;
          router.push(`/servers/${servers[0].id}/${servers[0].channels[0].id}`);
        } else {
          console.log("No servers available, staying on loading page");
          hasRedirected.current = true;
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load servers:", error);
        hasRedirected.current = true;
        setIsLoading(false);
      }
    };

    redirectToFirstServer();
  }, [token, listServers, router]);

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading your servers...</p>
      </div>
    </div>
  );
}