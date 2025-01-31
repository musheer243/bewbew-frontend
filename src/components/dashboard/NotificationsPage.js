import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import "../../styles/NotificationsPage.css"; // Import the CSS file

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId"); // Retrieve userId (modify as per your auth logic)

  useEffect(() => {
    if (!userId) return;

    // Fetch notifications from the backend
    axios
      .get(`${API_BASE_URL}/notifications/${userId}`)
      .then((response) => setNotifications(response.data))
      .catch((error) => console.error("Error fetching notifications:", error));
  }, [userId]);

  const handleNotificationClick = (notification) => {
    // Navigate to the relevant post or page
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
