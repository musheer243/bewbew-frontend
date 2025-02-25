// NotificationsPage.js
import React, { useContext, useEffect, useState } from "react";
import { WebSocketContext } from "../../context/WebSocketContext"; 
import { FaArrowLeft } from "react-icons/fa";
import "../../styles/NotificationsPage.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";



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

  // local state for follow requests
  const [followRequests, setFollowRequests] = useState([]);

  // which tab we’re viewing: “notifications” or “followRequests”
  const [viewMode, setViewMode] = useState("notifications");

  // current user’s ID, needed to fetch follow requests
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("jwtToken");

  // fetch follow requests when user clicks on “Follow Requests” tab
  useEffect(() => {
    if (viewMode === "followRequests") {
      fetchFollowRequests();
    }
  }, [viewMode]);

  const fetchFollowRequests = async () => {
    try {
      // GET /api/follow/requests/received/{receiverId}
      const url = `${API_BASE_URL}/api/follow/requests/received/${userId}`;
      const resp = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFollowRequests(resp.data);
    } catch (err) {
      console.error("Error fetching follow requests:", err);
    }
  };

  // handle accept follow request
  const handleAccept = async (requestId) => {
    try {
      // POST /api/follow/accept/{requestId}
      await axios.post(`${API_BASE_URL}/api/follow/accept/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // remove it from the local array
      setFollowRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error("Error accepting follow request:", err);
    }
  };

  // handle decline follow request
  const handleDecline = async (requestId) => {
    try {
      // POST /api/follow/decline/{requestId}
      await axios.post(`${API_BASE_URL}/api/follow/decline/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // remove it from the local array
      setFollowRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error("Error declining follow request:", err);
    }
  };


  return (
    <div className="notifications-container">
      <div className="notifications-box">
        {/* Top Bar with back arrow and two tabs */}
        <div className="top-bar">
          <div className="back-button-noti" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft className="back-icon" />
          </div>
          <h2 className="notifications-title">Notifications</h2>
        </div>

        {/* Simple tabs for switching */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${viewMode === "notifications" ? "active-tab" : ""}`}
            onClick={() => setViewMode("notifications")}
          >
            Notifications
          </button>
          <button
            className={`tab-btn ${viewMode === "followRequests" ? "active-tab" : ""}`}
            onClick={() => setViewMode("followRequests")}
          >
            Follow Requests
          </button>
        </div>
        <hr className="divider" />

        {viewMode === "notifications" ? (
          <>
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
                    className={`notification-item ${
                      !notification.read ? "unread" : ""
                    }`}
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
          </>
        ) : (
          /* Follow Requests tab */
          <div className="follow-requests-section">
            {followRequests.length === 0 ? (
              <p className="no-notifications">No follow requests.</p>
            ) : (
              <ul className="notifications-list">
                {followRequests.map((req) => (
                  <li key={req.id} className="notification-item unread">
                    {/* The user's profile pic on left */}
                    <div className="notification-left">
                      <img
                        src={req.senderProfilePic || "https://example.com/default-pic.jpg"}
                        alt="Sender Profile"
                        className="notification-profile-pic"
                      />
                    </div>
                    <div className="notification-content">
                      <p>
                        <strong>{req.senderName}</strong> wants to follow you.
                      </p>
                      {/* Accept / Decline icons or buttons */}
                      <div className="request-actions">
                        <button 
                          className="accept-btn" 
                          onClick={() => handleAccept(req.id)}
                        >
                          ✅
                        </button>
                        <button 
                          className="decline-btn" 
                          onClick={() => handleDecline(req.id)}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;