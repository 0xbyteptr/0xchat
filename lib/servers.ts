import { useState, useCallback } from "react";
import { Server, Invite } from "@/lib/types";
import { API_ENDPOINTS } from "@/lib/constants";

interface ServerResponse {
  success?: boolean;
  server?: Server;
  servers?: Server[];
  invite?: Invite;
  error?: string;
}

export function useServers(token: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const createServer = useCallback(
    async (name: string, description?: string): Promise<Server | null> => {
      if (!token) return null;
      setError("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/servers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "create", name, description }),
        });

        const data: ServerResponse = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to create server");
          return null;
        }

        return data.server || null;
      } catch (err) {
        setError("Network error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const listServers = useCallback(async (): Promise<Server[]> => {
    if (!token) return [];
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "list" }),
      });

      const data: ServerResponse = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load servers");
        return [];
      }

      return data.servers || [];
    } catch (err) {
      setError("Network error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const getServer = useCallback(
    async (serverId: string): Promise<Server | null> => {
      if (!token) return null;
      setError("");

      try {
        const response = await fetch("/api/servers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "get", serverId }),
        });

        const data: ServerResponse = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to get server");
          return null;
        }

        return data.server || null;
      } catch (err) {
        setError("Network error");
        return null;
      }
    },
    [token]
  );

  const createInvite = useCallback(
    async (serverId: string): Promise<Invite | null> => {
      if (!token) return null;
      setError("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/servers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "createInvite", serverId }),
        });

        const data: ServerResponse = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to create invite");
          return null;
        }

        return data.invite || null;
      } catch (err) {
        setError("Network error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const joinWithInvite = useCallback(
    async (inviteId: string): Promise<Server | null> => {
      if (!token) return null;
      setError("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/servers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "joinWithInvite", inviteId }),
        });

        const data: ServerResponse = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to join server");
          return null;
        }

        return data.server || null;
      } catch (err) {
        setError("Network error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  return {
    createServer,
    listServers,
    getServer,
    createInvite,
    joinWithInvite,
    isLoading,
    error,
    setError,
  };
}
