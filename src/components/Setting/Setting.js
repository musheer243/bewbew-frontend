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

const Settings = () => {
  const [user, setUser] = useState(null);
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

    const cachedProfile = localStorage.getItem("cachedProfile");
    if (cachedProfile) {
      const parsedProfile = JSON.parse(cachedProfile);
      setUser(parsedProfile);
    } else {
      fetchProfileData();
    }
  }, []);

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
          <RiGitRepositoryPrivateLine className="icon" size={27} /> Account Privacy
        </li>

        {/* Conditionally render Update Email and Update Password if oauthProvider is null */}
        
        {user && user.oauthProvider === null && (
          <>
            <li className="settings-item" data-tooltip="Update your Email">
              <BiLogoGmail className="icon" size={27} /> Update Email
            </li>
            <li className="settings-item" data-tooltip="Update your Password in case you forgot">
              <MdLockReset className="icon" size={27} /> Update Password
            </li>
          </>
        )}

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
        <li className="settings-item" data-tooltip="Saved Post" onClick={() => navigate("/post-activity/my-SavedPosts")}>
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
        <li className="settings-item" data-tooltip="Manage your close friends list">
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
        >
          About
        </li>
      </ul>
    </div>
  );
};

export default Settings;
