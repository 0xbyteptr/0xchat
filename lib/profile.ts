import { useState, useCallback } from "react";
import { User } from "@/lib/types";
import { getApiUrl } from "@/lib/api";

interface ProfileResponse {
  success?: boolean;
  user?: User;
  error?: string;
}

export function useProfile(token: string | null) {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async (): Promise<User | null> => {
    if (!token) return null;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/profile"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: ProfileResponse = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load profile");
        return null;
      }
      setProfile(data.user || null);
      return data.user || null;
    } catch (err) {
      setError("Network error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadProfileByUsername = useCallback(
    async (username: string): Promise<User | null> => {
      if (!token || !username) return null;
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(getApiUrl(`/api/profile?username=${encodeURIComponent(username)}`), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: ProfileResponse = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load profile");
          return null;
        }
        return data.user || null;
      } catch (err) {
        setError("Network error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const updateProfile = useCallback(
    async (updates: Partial<User>): Promise<User | null> => {
      if (!token) return null;
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(getApiUrl("/api/profile"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
        const data: ProfileResponse = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to update profile");
          return null;
        }
        setProfile(data.user || null);
        return data.user || null;
      } catch (err) {
        setError("Network error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  return { profile, isLoading, error, setError, loadProfile, loadProfileByUsername, updateProfile };
}
