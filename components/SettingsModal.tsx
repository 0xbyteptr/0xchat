"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { Shield, Mail, Bell, Eye, EyeOff, X, LogOut } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  user: User | null;
  onClose: () => void;
  onSave?: (updates: Partial<User>) => Promise<void>;
  onLogout?: () => void;
}

type SettingsTab = "account" | "security" | "privacy" | "notifications";

export default function SettingsModal({
  isOpen,
  isLoading = false,
  user,
  onClose,
  onSave,
  onLogout,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<"online" | "away" | "offline" | "dnd">("online");

  // Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Privacy
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<"public" | "friends" | "private">("friends");

  // Notifications
  const [notifyOnMessage, setNotifyOnMessage] = useState(true);
  const [notifyOnFriendRequest, setNotifyOnFriendRequest] = useState(true);
  const [notifyOnServerInvite, setNotifyOnServerInvite] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username || "");
      setBio(user.bio || "");
      setStatus(user.status || "online");
    }
  }, [user]);

  const handleSaveAccountSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!displayName.trim()) {
      setError("Display name cannot be empty");
      return;
    }

    try {
      if (onSave) {
        await onSave({
          displayName,
          bio,
          status,
        });
        setSuccess("Account settings saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-6 bg-slate-900/50">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-48 border-r border-slate-700 bg-slate-900/30 overflow-y-auto p-4 space-y-2">
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium flex items-center gap-3 ${
                activeTab === "account"
                  ? "bg-purple-600/30 text-purple-300 border-l-2 border-purple-500"
                  : "text-gray-400 hover:bg-slate-700/50 hover:text-gray-200"
              }`}
            >
              <Mail size={18} />
              Account
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium flex items-center gap-3 ${
                activeTab === "security"
                  ? "bg-purple-600/30 text-purple-300 border-l-2 border-purple-500"
                  : "text-gray-400 hover:bg-slate-700/50 hover:text-gray-200"
              }`}
            >
              <Shield size={18} />
              Security
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium flex items-center gap-3 ${
                activeTab === "privacy"
                  ? "bg-purple-600/30 text-purple-300 border-l-2 border-purple-500"
                  : "text-gray-400 hover:bg-slate-700/50 hover:text-gray-200"
              }`}
            >
              <Eye size={18} />
              Privacy
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium flex items-center gap-3 ${
                activeTab === "notifications"
                  ? "bg-purple-600/30 text-purple-300 border-l-2 border-purple-500"
                  : "text-gray-400 hover:bg-slate-700/50 hover:text-gray-200"
              }`}
            >
              <Bell size={18} />
              Notifications
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Alert Messages */}
            {error && (
              <div className="m-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="m-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
                {success}
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <form onSubmit={handleSaveAccountSettings} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={user?.username || ""}
                        disabled
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Your username cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Enter display name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        placeholder="Tell us about yourself"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "online" | "away" | "offline" | "dnd")}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="online">Online</option>
                        <option value="away">Away</option>
                        <option value="dnd">Do Not Disturb</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Two-Factor Authentication
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        twoFactorEnabled
                          ? "bg-green-600/30 text-green-300 hover:bg-green-600/40"
                          : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                      }`}
                    >
                      {twoFactorEnabled ? "Enabled" : "Enable"}
                    </button>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="pt-6 border-t border-slate-600">
                  <h3 className="text-lg font-semibold text-white mb-4">Logout</h3>
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to logout?")) {
                        onLogout?.();
                      }
                    }}
                    className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 hover:text-red-200 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                  <p className="text-xs text-gray-400 mt-3">
                    You will be logged out from all sessions and redirected to the login page.
                  </p>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="text-sm font-medium text-white">Show Online Status</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Let others see when you're online
                        </p>
                      </div>
                      <button
                        onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          showOnlineStatus
                            ? "bg-green-600/30 text-green-300 hover:bg-green-600/40"
                            : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                        }`}
                      >
                        {showOnlineStatus ? "On" : "Off"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="text-sm font-medium text-white">Allow Friend Requests</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Let anyone send you friend requests
                        </p>
                      </div>
                      <button
                        onClick={() => setAllowFriendRequests(!allowFriendRequests)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          allowFriendRequests
                            ? "bg-green-600/30 text-green-300 hover:bg-green-600/40"
                            : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                        }`}
                      >
                        {allowFriendRequests ? "On" : "Off"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="text-sm font-medium text-white">Allow Direct Messages</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Let anyone send you direct messages
                        </p>
                      </div>
                      <button
                        onClick={() => setAllowDMs(!allowDMs)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          allowDMs
                            ? "bg-green-600/30 text-green-300 hover:bg-green-600/40"
                            : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                        }`}
                      >
                        {allowDMs ? "On" : "Off"}
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Profile Visibility
                      </label>
                      <select
                        value={profileVisibility}
                        onChange={(e) => setProfileVisibility(e.target.value as any)}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="public">Public - Anyone can see your profile</option>
                        <option value="friends">Friends - Only friends can see</option>
                        <option value="private">Private - Profile is hidden</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="text-sm font-medium text-white">Message Notifications</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Get notified when you receive messages
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifyOnMessage(!notifyOnMessage)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          notifyOnMessage
                            ? "bg-green-600/30 text-green-300 hover:bg-green-600/40"
                            : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                        }`}
                      >
                        {notifyOnMessage ? "On" : "Off"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="text-sm font-medium text-white">Friend Request Notifications</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Get notified when you receive friend requests
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifyOnFriendRequest(!notifyOnFriendRequest)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          notifyOnFriendRequest
                            ? "bg-green-600/30 text-green-300 hover:bg-green-600/40"
                            : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                        }`}
                      >
                        {notifyOnFriendRequest ? "On" : "Off"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="text-sm font-medium text-white">Server Invite Notifications</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Get notified when you're invited to servers
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifyOnServerInvite(!notifyOnServerInvite)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          notifyOnServerInvite
                            ? "bg-green-600/30 text-green-300 hover:bg-green-600/40"
                            : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                        }`}
                      >
                        {notifyOnServerInvite ? "On" : "Off"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="text-sm font-medium text-white">Email Notifications</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Send notifications via email
                        </p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          emailNotifications
                            ? "bg-green-600/30 text-green-300 hover:bg-green-600/40"
                            : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                        }`}
                      >
                        {emailNotifications ? "On" : "Off"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
