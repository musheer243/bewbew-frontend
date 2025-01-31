import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import "../../styles/NotificationsPage.css";
import { Client } from "@stomp/stompjs";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId"); // Retrieve userId from localStorage
  const token = localStorage.getItem("jwtToken"); // Retrieve JWT token

  useEffect(() => {
    if (!userId || !token) return; // Ensure userId and token are available

    // Fetch existing notifications from the backend
    axios
      .get(`${API_BASE_URL}/api/notifications/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Attach JWT token in headers
        },
      })
      .then((response) => setNotifications(response.data))
      .catch((error) => console.error("Error fetching notifications:", error));

    // Initialize WebSocket connection
    const stompClient = new Client({
        brokerURL: "ws://localhost:9090/ws", // WebSocket endpoint for localhost backend
        reconnectDelay: 5000, // Reconnect on failure
    });

    stompClient.onConnect = () => {
      console.log("Connected to WebSocket");

      // Subscribe to the user's notifications channel
      stompClient.subscribe(`/user/${userId}/queue/notifications`, (message) => {
        const newNotification = JSON.parse(message.body);
        setNotifications((prev) => [newNotification, ...prev]);
      });
    };

    stompClient.onStompError = (frame) => {
      console.error("WebSocket error:", frame);
    };

    stompClient.activate(); // Start the WebSocket connection

    return () => {
      stompClient.deactivate(); // Clean up WebSocket connection on unmount
    };
  }, [userId, token]);

  const handleNotificationClick = (notification) => {
    navigate(notification.redirectUrl);
  };

  return (
    <div className="notifications-container">
      <div className="notifications-box">
        <h2 className="notifications-title">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="no-notifications">No notifications yet.</p>
        ) : (
          <ul className="notifications-list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="notification-item"
                onClick={() => handleNotificationClick(notification)}
              >
                {notification.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
