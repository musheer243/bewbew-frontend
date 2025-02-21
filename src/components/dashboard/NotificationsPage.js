// NotificationsPage.js
import React, { useContext } from "react";
import { WebSocketContext } from "../../context/WebSocketContext"; 
import { FaArrowLeft } from "react-icons/fa";
import "../../styles/NotificationsPage.css";
import { useNavigate } from "react-router-dom";


const NotificationsPage = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllAsRead 
  } = useContext(WebSocketContext);

  const navigate = useNavigate();

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    navigate(notification.redirectUrl);
  };

  return (
    <div className="notifications-container">
      <div className="notifications-box">
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
                      "https://example.com/default-pic.jpg"
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
