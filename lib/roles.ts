import { useState } from "react";
import { ServerRole, ServerMember } from "@/lib/types";

const API_ENDPOINTS = {
  createRole: "/api/roles",
  assignRole: "/api/roles",
  removeRole: "/api/roles",
  getRoles: "/api/roles",
  getMemberRoles: "/api/roles",
};

export function useRoles(token: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRole = async (
    serverId: string,
    name: string,
    color?: string,
    permissions: string[] = []
  ): Promise<ServerRole | null> => {
    if (!token) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.createRole, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "createRole",
          serverId,
          name,
          color,
          permissions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create role");
      }

      return data.role;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error creating role:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const assignRole = async (
    serverId: string,
    userId: string,
    roleId: string
  ): Promise<ServerMember | null> => {
    if (!token) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.assignRole, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "assignRole",
          serverId,
          userId,
          roleId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign role");
      }

      return data.memberRole;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error assigning role:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const removeRole = async (
    serverId: string,
    userId: string,
    roleId: string
  ): Promise<ServerMember | null> => {
    if (!token) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.removeRole, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "removeRole",
          serverId,
          userId,
          roleId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove role");
      }

      return data.memberRole;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error removing role:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getRoles = async (serverId: string): Promise<ServerRole[] | null> => {
    if (!token) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.getRoles}?action=getRoles&serverId=${serverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch roles");
      }

      return data.roles;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching roles:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberRoles = async (
    serverId: string
  ): Promise<ServerMember[] | null> => {
    if (!token) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.getMemberRoles}?action=getMemberRoles&serverId=${serverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch member roles");
      }

      return data.memberRoles;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching member roles:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createRole,
    assignRole,
    removeRole,
    getRoles,
    getMemberRoles,
  };
}
