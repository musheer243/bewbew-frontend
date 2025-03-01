// WebSocketContext.js (or NotificationContext.js, naming is flexible)
import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { Client, Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WEBSOCKET_URL, API_BASE_URL } from "../config";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);    // Entire notifications list
  const [notificationCount, setNotificationCount] = useState(0); // Number of unread
  const [recentChats, setRecentChats] = useState([]);
  const [chatStompClient, setChatStompClient] = useState(null);
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
          // If it's unread, increment count
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
              // If we're changing from unread -> read, decrement the count
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

  // Calculate total unread messages from all chats
  const unreadChatCount = useMemo(
    () => recentChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0),
    [recentChats]
  );

  // Fetch recent chats - this now gets unread counts from the server
  const fetchRecentChats = useCallback(async () => {
    if (!userId || !token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messages/${userId}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store the chat data with unread counts from server
        setRecentChats(data.map(chat => ({ 
          ...chat, 
          unreadCount: chat.unreadCount || 0,
          username: chat.username || chat.senderUsername || "Unknown User" // Add username fallbacks
        })));
      } else {
        console.error('Failed to fetch recent chats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching recent chats:', error);
    }
  }, [userId, token]);

  // Initialize chat WebSocket connection
  useEffect(() => {
    if (!userId || !token) return;

    const socket = new SockJS(`${WEBSOCKET_URL}`);
    const client = Stomp.over(socket);
    
    client.connect({ Authorization: `Bearer ${token}` }, () => {
      // Subscribe to new messages
      client.subscribe(`/user/queue/messages`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        const isMyMessage = receivedMessage.senderId === parseInt(userId);

        // Update recent chats
        setRecentChats(prev => {
          const existing = prev.find(c => c.id === receivedMessage.chatId || 
                                      c.id === receivedMessage.senderId || 
                                      c.id === receivedMessage.receiverId);
          if (existing) {
            return prev.map(c => (c.id === receivedMessage.chatId || 
                               c.id === receivedMessage.senderId || 
                               c.id === receivedMessage.receiverId)
              ? { 
                  ...c, 
                  username: c.username || receivedMessage.senderUsername, // Keep existing username if present
                  profilepic: c.profilepic || receivedMessage.senderProfilePic,
                  unreadCount: isMyMessage ? c.unreadCount : (c.unreadCount || 0) + 1 
                }
              : c
            );
          }
          
          return [...prev, {
            id: receivedMessage.senderId,
            username: receivedMessage.senderUsername,
            profilepic: receivedMessage.senderProfilePic,
            unreadCount: isMyMessage ? 0 : 1
          }];
        });
      });

      // Subscribe to read status updates to update unread count
      client.subscribe(`/user/queue/read-status`, (message) => {
        const readUpdate = JSON.parse(message.body);
        // No need to update recentChats here as we'll do it in markChatAsRead
      });
    });

    setChatStompClient(client);
    return () => client.disconnect();
  }, [userId, token]);

  // Mark chat as read function - update server AND local state
  const markChatAsRead = useCallback(async (chatUserId) => {
    // First update local state
    setRecentChats(prev => 
      prev.map(chat => 
        chat.id === chatUserId ? { ...chat, unreadCount: 0 } : chat
      )
    );
    
    // Then update server (Add an API endpoint if needed)
    // This is where we need to add code to persist the read status on the server
    try {
      // You might need to implement this endpoint in your backend
      await fetch(`${API_BASE_URL}/api/v1/messages/mark-chat-read/${userId}/${chatUserId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });
    } catch (error) {
      console.error('Error marking chat as read on server:', error);
    }
  }, [userId, token]);

  // In WebSocketProvider.js, add this effect to load chats when component mounts
  useEffect(() => {
    if (userId && token) {
      fetchRecentChats();
    }
  }, [userId, token, fetchRecentChats]);

  return (
    <WebSocketContext.Provider
      value={{
        notifications,
        notificationCount,
        markNotificationAsRead,
        markAllAsRead,
        recentChats,
        unreadChatCount,
        markChatAsRead,
        chatStompClient,
        fetchRecentChats // Export this so components can call it when needed
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};