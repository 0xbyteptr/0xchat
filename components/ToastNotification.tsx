"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Toast } from "@/lib/notification-types";

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export default function ToastNotification({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  const bgColor = {
    success: "bg-green-900/80 border-green-600/30",
    error: "bg-red-900/80 border-red-600/30",
    info: "bg-blue-900/80 border-blue-600/30",
    warning: "bg-yellow-900/80 border-yellow-600/30",
  };

  const textColor = {
    success: "text-green-300",
    error: "text-red-300",
    info: "text-blue-300",
    warning: "text-yellow-300",
  };

  const icon = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
  };

  return (
    <div
      className={`${bgColor[toast.type]} ${textColor[toast.type]} border rounded-lg px-4 py-3 flex items-start gap-3 animate-slide-in backdrop-blur-md`}
      role="alert"
    >
      <div className="mt-0.5 shrink-0">{icon[toast.type]}</div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-200 transition shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
