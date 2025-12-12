"use client";

import { Toast } from "@/lib/notification-types";
import ToastNotification from "./ToastNotification";

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 space-y-3 z-40 pointer-events-auto max-w-md">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
