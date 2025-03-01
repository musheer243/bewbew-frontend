// Settings.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";

import "../../styles/setting.css"; // Assuming your styles are here
import { LiaUserEditSolid } from "react-icons/lia";
import { RiGitRepositoryPrivateLine } from "react-icons/ri";
import { LuCalendarHeart } from "react-icons/lu";
import { BiBookmarkHeart } from "react-icons/bi";
import { RiHeartsLine } from "react-icons/ri";
import { ImBlocked } from "react-icons/im";
import { IoHeartCircleOutline } from "react-icons/io5";
import { HiTranslate } from "react-icons/hi";
import { LiaHandsHelpingSolid } from "react-icons/lia";
import { FaArrowLeft } from "react-icons/fa";
import { MdLockReset } from "react-icons/md";
import { BiLogoGmail } from "react-icons/bi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoClose } from "react-icons/io5";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("jwtToken");

        if (!userId || !token) {
          console.error("User ID or token is missing!");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const profileData = response.data;
          setUser(profileData);
          localStorage.setItem("cachedProfile", JSON.stringify(profileData));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    // Check cached profile in local storage
    const cachedProfile = localStorage.getItem("cachedProfile");
    if (cachedProfile) {
      setUser(JSON.parse(cachedProfile));
    } else {
      fetchProfileData();
    }
  }, []);

  // Function to handle toggle change for privacy
  const togglePrivacy = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("jwtToken");
      await axios.post(
        `${API_BASE_URL}/api/users/${user.id}/toggle-privacy`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedUser = { ...user, private: !user.private };
      setUser(updatedUser);
      localStorage.setItem("cachedProfile", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error toggling privacy: ", error);
      alert("Failed to update account privacy.");
    }
  };

  // Open the delete account confirmation popup
  const handleDeleteAccountClick = () => {
    setShowDeletePopup(true);
  };

  // Close the delete account popup and reset the text field
  const closeDeletePopup = () => {
    setShowDeletePopup(false);
    setDeleteConfirmationText("");
  };

  // Call the API to delete the user if the typed text is "DELETE"
  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() === "DELETE") {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          console.error("JWT token is missing");
          return;
        }
        // Call the backend DELETE API using axios
        const response = await axios.delete(
          `${API_BASE_URL}/api/users/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 200) {
          alert("Account deleted successfully.");
          // Clear user data and redirect to login (or home)
          localStorage.clear();
          navigate("/");
        } else {
          console.error("Failed to delete account.");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("An error occurred while deleting the account.");
      } finally {
        closeDeletePopup();
      }
    } else {
      alert('Please type "DELETE" exactly to confirm.');
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="back-button" onClick={() => navigate("/dashboard")}>
        <FaArrowLeft className="back-icon" size={27} />
      </div>

      {user && <h3>Welcome, {user.username}</h3>}

      <ul className="settings-list">
        <h1 className="settings-title">Your Account</h1>
        <li className="settings-item" data-tooltip="Edit your settings">
          <LiaUserEditSolid className="icon" size={27} /> Edit Profile
        </li>
        <li className="settings-item" data-tooltip="Adjust your privacy preferences">
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <div>
              <RiGitRepositoryPrivateLine className="icon" size={27} /> Account Privacy
            </div>
            <div style={{ marginLeft: "auto" }}>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={user?.private || false}
                  onChange={togglePrivacy}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </li>

        {/* Conditionally render Update Email and Update Password if oauthProvider is null */}
        {user && user.oauthProvider === null && (
          <>
            <li
              className="settings-item"
              data-tooltip="Update your Email"
              onClick={() => navigate("/your-account/updateEmail")}
            >
              <BiLogoGmail className="icon" size={27} /> Update Email
            </li>
            <li
              className="settings-item"
              data-tooltip="Update your Password in case you forgot"
              onClick={() => navigate("/your-account/updatePassword")}
            >
              <MdLockReset className="icon" size={27} /> Update Password
            </li>
          </>
        )}

        <li
          className="settings-item"
          data-tooltip="If incase you want to delete your account permanently!"
          onClick={handleDeleteAccountClick}
        >
          <RiDeleteBin6Line className="icon" size={27} /> Delete Account
        </li>

        <h1 className="settings-title" style={{ marginTop: "30px" }}>
          Post Activity
        </h1>
        <li
          className="settings-item"
          data-tooltip="The Posts you Liked"
          onClick={() => navigate("/post-activity/my-LikedPosts")}
        >
          <RiHeartsLine className="icon" size={27} /> My Liked
        </li>
        <li
          className="settings-item"
          data-tooltip="Saved Post"
          onClick={() => navigate("/post-activity/my-SavedPosts")}
        >
          <BiBookmarkHeart className="icon" size={27} /> My Saved
        </li>

        <li
          className="settings-item"
          data-tooltip="Manage Scheduled Post"
          onClick={() => navigate("/post-activity/my-ScheduledPosts")}
        >
          <LuCalendarHeart className="icon" size={27} /> My Schedule Post
        </li>

        <h1 className="settings-title" style={{ marginTop: "30px" }}>
          Manage Users
        </h1>
        <li className="settings-item" data-tooltip="See blocked users">
          <ImBlocked className="icon" size={27} /> Blocked
        </li>
        <li className="settings-item" data-tooltip="Manage your close friends list"   onClick={() => navigate("/friends", { state: { initialTab: "close" } })}
        >
          <IoHeartCircleOutline className="icon" size={27} /> Close Friends
        </li>

        <h1 className="settings-title" style={{ marginTop: "30px" }}>
          Language & Support
        </h1>
        <li className="settings-item" data-tooltip="Change your language">
          <HiTranslate className="icon" size={27} /> Language
        </li>
        <li className="settings-item" data-tooltip="Get help & support">
          <LiaHandsHelpingSolid className="icon" size={27} /> Help
        </li>
        <li
          className="settings-item"
          data-tooltip="Learn more about us"
          style={{ alignItems: "center", justifyContent: "center", marginTop: "20px" }}
          onClick={() => navigate("/about")}
        >
          About
        </li>
      </ul>

      {/* Delete Account Confirmation Popup */}
      {showDeletePopup && (
        <div className="SinglePost-delete-popup-overlay">
          <div className="SinglePost-delete-popup">
            <button
              className="SinglePost-delete-popup-close-btn"
              onClick={closeDeletePopup}
            >
              <IoClose size={20} />
            </button>
            <h3 className="SinglePost-delete-popup-title">
              Are you sure you want to delete your account?
            </h3>
            <p className="SinglePost-delete-popup-instruction">
              Type <strong>DELETE</strong> in the box below to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="SinglePost-delete-input"
              placeholder='Type "DELETE" here'
            />
            <button
              className="SinglePost-delete-confirm-btn"
              onClick={handleConfirmDeleteAccount}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
