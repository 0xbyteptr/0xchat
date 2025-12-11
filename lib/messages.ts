import { useCallback } from "react";
import { Message } from "./types";
import { API_ENDPOINTS } from "./constants";
import { decryptMessageIfPossible } from "./client-crypto";

const MESSAGE_KEY = process.env.NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY;

export function useMessages(token: string | null) {
  const loadMessages = useCallback(
    async (channel: string): Promise<Message[]> => {
      if (!token) {
        console.error("No authentication token");
        return [];
      }

      try {
        const response = await fetch(`${API_ENDPOINTS.MESSAGES}?channel=${channel}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch messages for ${channel}:`, response.status);
          return [];
        }

        const data = await response.json();
        const messages = data.messages || [];

        const decrypted = await Promise.all(
          messages.map(async (msg: any) => {
            try {
              let content = msg.content || "";
              if (MESSAGE_KEY && msg.iv && msg.tag && typeof msg.content === "string") {
                try {
                  const maybe = await decryptMessageIfPossible({
                    encrypted: msg.content,
                    iv: msg.iv,
                    tag: msg.tag,
                    keyHex: MESSAGE_KEY,
                  });
                  if (maybe) content = maybe;
                } catch (decryptErr) {
                  console.warn("Decryption failed, using original content");
                }
              }

              return {
                ...msg,
                content,
                timestamp:
                  typeof msg.timestamp === "string"
                    ? new Date(msg.timestamp)
                    : msg.timestamp,
              } as Message;
            } catch (err) {
              console.error("Error processing message:", err);
              return msg as Message;
            }
          })
        );

        return decrypted;
      } catch (error) {
        console.error(`Error fetching messages for ${channel}:`, error);
        return [];
      }
    },
    [token]
  );

  const sendMessage = useCallback(
    async (channel: string, message: Message): Promise<boolean> => {
      if (!token) {
        console.error("No authentication token");
        return false;
      }

      try {
        const response = await fetch(API_ENDPOINTS.MESSAGES, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ channel, message }),
        });

        return response.ok;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    },
    [token]
  );

  return { loadMessages, sendMessage };
}
