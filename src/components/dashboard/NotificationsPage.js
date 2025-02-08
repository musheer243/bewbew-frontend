import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WEBSOCKET_URL, API_BASE_URL } from "../../config"; // Ensure these are defined in your config file
import "../../styles/NotificationsPage.css";
import { FaArrowLeft } from "react-icons/fa"; // Import the back arrow icon

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");      // e.g., "2" or your user id string
  const token = localStorage.getItem("jwtToken");       // e.g., your JWT token

  // Fetch notifications from REST API on page load
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  },[userId, token]);

  // Mark a single notification as read via REST API
  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/single/mark-as-read/${notificationId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        // Update state: mark this notification as read
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      } else {
        console.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read via REST API
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/mark-as-read/${userId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        // Update state: mark every notification as read
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
      } else {
        console.error("Failed to mark all notifications as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Handle click on a notification:
  // If it is unread, mark it as read then navigate to the redirect URL.
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    navigate(notification.redirectUrl);
  };

  useEffect(() => {
    if (!userId || !token) {
      console.error("User ID or JWT token is missing.");
      return;
    }

    // Fetch initial notifications from API
    fetchNotifications();

     // Remove token from URL
  const socketUrl = WEBSOCKET_URL;
  console.log("Using WebSocket URL:", socketUrl);

  const stompClient = new Client({
    webSocketFactory: () => new SockJS(`${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`),
    connectHeaders: {
      Authorization: `Bearer ${token}` // Optional, but good practice
    },
    reconnectDelay: 5000,
    debug: (msg) => console.log("STOMP Debug:", msg),
  });

    stompClient.onConnect = () => {
      console.log("✅ Connected to WebSocket");
      stompClient.subscribe(`/user/queue/notifications`, (message) => {
        console.log("📩 Raw WebSocket message:", message.body);
        try {
          const newNotification = JSON.parse(message.body);
          // Prepend the new notification to the list
          setNotifications((prev) => [newNotification, ...prev]);
        } catch (e) {
          console.error("Error parsing notification", e);
        }
      });
      console.log("🔔 Subscribed to /user/queue/notifications");
    };

    stompClient.onStompError = (frame) => {
      console.error("❌ WebSocket STOMP error:", frame);
    };

    stompClient.onWebSocketError = (error) => {
      console.error("❌ WebSocket connection error:", error);
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [userId, token, fetchNotifications]);

  return (
    <div className="notifications-container">
      <div className="notifications-box">
      {/* Back Button */}
      <div className="back-button-noti" onClick={() => navigate("/dashboard")}>
          <FaArrowLeft className="back-icon" />
        </div>
        <h2 className="notifications-title">Notifications</h2>
        <hr className="divider" />
        <div className="mark-all-btn">
          <button onClick={markAllAsRead} className="mark-all-btn-text">
            Mark All as Read
          </button>
        </div>
        {notifications.length === 0 ? (
          <p className="no-notifications">No notifications yet.</p>
        ) : (
          <ul className="notifications-list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`notification-item ${!notification.read ? "unread" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-left">
                  <img
                    src={
                      notification.senderProfilePicUrl ||
                      "https://bewbew-images-bucket.s3.us-east-1.amazonaws.com/profile_pic.jfif"
                    }
                    alt="Sender Profile"
                    className="notification-profile-pic"
                  />
                </div>
                <div className="notification-content">
                  <p>{notification.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
