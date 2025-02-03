import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import "../../styles/NotificationsPage.css";
import { Client } from "@stomp/stompjs";
import { WEBSOCKET_URL } from "../../config";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId"); // Retrieve userId from localStorage
  const token = localStorage.getItem("jwtToken"); // Retrieve JWT token

  useEffect(() => {
    if (!userId || !token) {
      console.error("User ID or JWT token is missing.");
      return;
    }
  
    console.log("Establishing WebSocket connection with token:", token);
  
    const stompClient = new Client({
      brokerURL: `${WEBSOCKET_URL}`,
      reconnectDelay: 5000,
      // connectHeaders: {
      //   Authorization: `Bearer ${token}`,
      // },
      debug: (str) => {
        console.log("STOMP Debug:", str); // Log STOMP debug messages
      },
    });
  
    stompClient.onConnect = () => {
      console.log("Connected to WebSocket");
      stompClient.subscribe(`/user/${userId}/queue/notifications`, (message) => {
        const newNotification = JSON.parse(message.body);
        setNotifications((prev) => [newNotification, ...prev]);
      });
    };
  
    stompClient.onStompError = (frame) => {
      console.error("WebSocket error:", frame);
    };
  
    stompClient.onWebSocketError = (error) => {
      console.error("WebSocket connection error:", error);
    };
  
    stompClient.onDisconnect = () => {
      console.log("WebSocket disconnected");
    };
  
    stompClient.activate();
  
    return () => {
      stompClient.deactivate();
    };
  }, [userId, token]);

  const handleNotificationClick = (notification) => {
    navigate(notification.redirectUrl);
  };

  const handleMarkAllAsRead = () => {
    // Logic for marking all as read can go here
    console.log("Marking all notifications as read");
  };

  

  return (
    <div className="notifications-container">
      <div className="notifications-box">
        <h2 className="notifications-title">Notifications</h2>
        <hr className="divider" />
        <div className="mark-all-btn">
          <button onClick={handleMarkAllAsRead} className="mark-all-btn-text">
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
                className="notification-item"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-left">
                  <img
                    src={notification.senderProfilePicUrl || "https://bewbew-images-bucket.s3.us-east-1.amazonaws.com/profile_pic.jfif"} // Assuming the notification has a userProfilePic field
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
