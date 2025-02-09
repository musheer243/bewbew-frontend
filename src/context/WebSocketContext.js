// src/context/WebSocketContext.js
import React, { createContext, useState, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WEBSOCKET_URL } from "../config";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const token = localStorage.getItem("jwtToken");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId || !token) return;
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      // Subscribe to notifications
      client.subscribe(`/user/queue/notifications`, (message) => {
        try {
          const notification = JSON.parse(message.body);
          // Check the "read" property. (Assumes default Jackson behavior
          // where the boolean field is serialized as "read".)
          if (!notification.read) {
            setNotificationCount((prev) => prev + 1);
          }
        } catch (error) {
          console.error("Error parsing notification:", error);
        }
      });

      // Subscribe to messages
      client.subscribe(`/user/queue/messages`, (message) => {
        try {
          // NOTE: The following variable is kept as it was previously,
          // even though it is not used. You can safely ignore the warning.
          const newMsg = JSON.parse(message.body);
          setUnreadMessageCount((prev) => prev + 1);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      });
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [userId, token]);

  return (
    <WebSocketContext.Provider
      value={{
        notificationCount,
        setNotificationCount,
        unreadMessageCount,
        setUnreadMessageCount,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
