"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface User {
  id: string;
  username: string;
  avatar: string;
}

interface NewDMModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, userName: string, avatar: string) => void;
}

export default function NewDMModal({
  token,
  isOpen,
  onClose,
  onSelectUser,
}: NewDMModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !searchQuery) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/profile?username=${encodeURIComponent(searchQuery)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUsers([data.user]);
          } else {
            setUsers([]);
          }
        } else {
          setError("User not found");
          setUsers([]);
        }
      } catch (err) {
        console.error("Error searching users:", err);
        setError("Failed to search users");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, token, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Start a DM</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading && (
            <p className="text-gray-400 text-sm">Searching...</p>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {users.length === 0 && !loading && searchQuery && (
            <p className="text-gray-400 text-sm">No users found</p>
          )}

          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelectUser(user.id, user.username, user.avatar);
                setSearchQuery("");
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition"
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full"
              />
              <span className="text-white font-medium">{user.username}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
