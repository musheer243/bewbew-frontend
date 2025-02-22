// WebSocketContext.js (or NotificationContext.js, naming is flexible)
import React, { createContext, useState, useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WEBSOCKET_URL, API_BASE_URL } from "../config";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);    // Entire notifications list
  const [notificationCount, setNotificationCount] = useState(0); // Number of unread
  const token = localStorage.getItem("jwtToken");
  const userId = localStorage.getItem("userId");

  // 1) On mount, do an initial fetch from your REST API
  const fetchNotifications = useCallback(async () => {
    if (!userId || !token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();

        // Sort descending by timestamp
        const sorted = data.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        setNotifications(sorted);
        // Count how many are unread
        const unreadCount = sorted.filter((n) => !n.read).length;
        setNotificationCount(unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [userId, token]);

  // // "Expose" this method under a different name so it's clear it can be called
  // const refetchNotifications = () => {
  //   fetchNotifications();
  // };

  // 2) Connect WebSocket
  useEffect(() => {
    if (!userId || !token) return;

    // Initial fetch
    fetchNotifications();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      // Subscribe for new notifications
      client.subscribe(`/user/queue/notifications`, (message) => {
        try {
          const newNotification = JSON.parse(message.body);
          // Insert at top
          setNotifications((prev) => [newNotification, ...prev]);
          // If it’s unread, increment count
          if (!newNotification.read) {
            setNotificationCount((prev) => prev + 1);
          }
        } catch (err) {
          console.error("Error parsing WebSocket notification:", err);
        }
      });
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [userId, token, fetchNotifications]);

  // 3) Helper to mark single notification as read (updates local state + calls your API)
  const markNotificationAsRead = async (notificationId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/notifications/single/mark-as-read/${notificationId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => {
            if (n.id === notificationId) {
              // If we’re changing from unread -> read, decrement the count
              if (!n.read) setNotificationCount((count) => Math.max(count - 1, 0));
              return { ...n, read: true };
            }
            return n;
          })
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // 4) Helper to mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/notifications/mark-as-read/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        // Locally set them all read
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setNotificationCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        notifications,
        notificationCount,
        markNotificationAsRead,
        markAllAsRead,
        // refetchNotifications,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
