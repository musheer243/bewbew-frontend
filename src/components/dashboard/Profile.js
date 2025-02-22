import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import styles from "../../styles/Profile.module.css"; // CSS Module
import { FaArrowLeft } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { FaUserEdit } from "react-icons/fa";
import { GrUserSettings } from "react-icons/gr";
import { TbTags } from "react-icons/tb";
import { BiLogOut } from "react-icons/bi";
import { SlUserFollow } from "react-icons/sl";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";

const Profile = () => {
  const { userId } = useParams(); // Extract userId from the URL
  const location = useLocation();
  const navigate = useNavigate();
  const loggedInUserId = localStorage.getItem("userId"); // Assuming you store the logged-in user's ID in localStorage
  const token = localStorage.getItem("jwtToken"); // Retrieve JWT token from localStorage

  const [user, setUser] = useState(location.state?.user); // Use user from location.state if available
  const [loading, setLoading] = useState(!location.state?.user); // If user is not in location.state, set loading to true
  const [error, setError] = useState(null);
  const [isFollowed, setIsFollowed] = useState(false); // Local state to hold follow status
  const [showOptions, setShowOptions] = useState(false); // State for dropdown

  useEffect(() => {
    // If no userId is provided (i.e., /profile), redirect to the logged-in user's profile
    if (!userId && loggedInUserId) {
      navigate(`/profile/${loggedInUserId}`);
      return;
    }

    // If user is not available in location.state, fetch user data from the backend
    if (!user) {
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include JWT token in the request headers
          },
        })
        .then((response) => {
          setUser(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setError("Failed to load user data");
          setLoading(false);
        });
    }
  }, [userId, user, loggedInUserId, navigate, token]);

  // If viewing someone else's profile, hit the API to check follow status
  useEffect(() => {
    if (user && Number(loggedInUserId) !== Number(user.id)) {
      axios
        .get(
          `${API_BASE_URL}/api/users/${user.id}/is-followed?followerid=${loggedInUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => {
          setIsFollowed(response.data.isFollowed);
        })
        .catch((error) => {
          console.error("Error checking follow status:", error);
        });
    }
  }, [loggedInUserId, user, token]);

  if (loading) {
    return (
      <div className={styles["loading-container"]}>
        <div className={styles["spinner"]}></div>{" "}
        {/* Add your CSS spinner here */}
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!user) {
    return <div>User data is not available.</div>;
  }

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const toggleOptions = () => {
    setShowOptions((prev) => !prev);
    console.log("Icon clicked!"); // Add this to check if the function gets called
  };

  // Toggle follow status
  const handleFollowToggle = () => {
    // If not currently following, call the follow API
    if (!isFollowed) {
      axios
        .post(
          `${API_BASE_URL}/api/follow/send/${loggedInUserId}/${user.id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => {
          // The API can return either "Followed successfully" (if the profile is public)
          // or "Follow request sent" (if the profile is private)
          console.log(response.data);
          setIsFollowed(true);
        })
        .catch((error) => {
          console.error("Error sending follow request:", error);
        });
    } else {
      // If already following, call the unfollow API
      axios
        .post(
          `${API_BASE_URL}/api/follow/${loggedInUserId}/unfollow/${user.id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => {
          console.log(response.data);
          setIsFollowed(false);
        })
        .catch((error) => {
          console.error("Error unfollowing user:", error);
        });
    }
  };

  //Logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("No token found, user may not be logged in.");
        localStorage.clear();
        navigate("/");
        return;
      }

      // Send logout request to the backend
      await axios.post(
        `${API_BASE_URL}/api/v1/auth/logout`, // Replace with your logout endpoint
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Clear client-side authentication
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      localStorage.clear();
      navigate("/");
    }
  };

  const handleSeePosts = () => {
    console.log(
      "Type of loggedInUserId:",
      typeof loggedInUserId,
      "Value:",
      loggedInUserId
    );
    console.log("Type of user.id:", typeof user.id, "Value:", user.id);

    if (Number(loggedInUserId) === Number(user.id)) {
      console.log("✅ Navigating to /my-posts");
      navigate("/my-posts", { state: { userId: loggedInUserId } }); // Pass userId explicitly
    } else {
      console.log(`🔄 Navigating to /posts/${user.id}`);
      navigate(`/posts/${user.id}`, { state: { userId: user.id } });
    }
  };

  const handleMessageClick = () => {
    // Pass user in location state
    navigate("/chat", {
      state: {
        userToChat: user,
      },
    });
  };

  return (
    <div className={styles["page-container"]}>
      <div className={styles["profile-container"]}>
        <div className={styles["main-container"]}>
          {/* Back Button */}
          <button
            className={styles["back-button"]}
            onClick={handleBackToDashboard}
          >
            <FaArrowLeft />
          </button>

          {/* More Options Button - 
      Only visible if the logged-in 
      user is viewing their own profile */}

          {/* <div className={styles["options-container"]}>
        <button className={styles["options-button"]} onClick={toggleOptions}>
          <IoMdSettings size={34} />
        </button>
      </div> */}

          {loggedInUserId === userId && (
            <div className={styles["options-container"]}>
              <button
                className={styles["options-button"]}
                onClick={toggleOptions}
              >
                <IoMdSettings size={34} />
              </button>
            </div>
          )}

          {/* Dropdown Menu */}
          {showOptions && (
            <div className={styles["dropdown-menu"]}>
              <div
                className={styles["dropdown-item"]}
                onClick={() => alert("Edit Profile")}
              >
                <FaUserEdit className={styles["dropdown-icon"]} /> Edit Profile
              </div>
              <div
                className={styles["dropdown-item"]}
                onClick={() => navigate("/account-setting")}
              >
                <GrUserSettings className={styles["dropdown-icon"]} /> Account
                Settings
              </div>
              <div
                className={styles["dropdown-item"]}
                onClick={() => alert("Saved Items")}
              >
                <TbTags className={styles["dropdown-icon"]} /> Saved
              </div>
              <div
                className={styles["dropdown-item"]}
                onClick={() => alert("Follow and Invite Friends")}
              >
                <SlUserFollow className={styles["dropdown-icon"]} /> Follow &
                Invite Friends
              </div>
              <div className={styles["dropdown-item"]} onClick={handleLogout}>
                <BiLogOut className={styles["dropdown-icon"]} /> Logout
              </div>
            </div>
          )}

          {/* Profile Picture */}
          <div className={styles["profile-picture-container"]}>
            <img
              src={user.profilepic}
              alt={`${user.name}'s Profile`}
              className={styles["profile-picture"]}
            />
          </div>

          {/*name */}
          <h2 className={styles["profile-name"]}>{user.name}</h2>
          <p
            style={{
              textAlign: "center",
              color: "#555",
              marginBottom: "5px",
              fontSize: "20px",
            }}
          >
            @{user.username}
          </p>
          {/*About */}
          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            {/* <h4>About</h4> */}
            <p style={{ color: "#555", lineHeight: "1.6", fontSize: "17px" }}>
              {user.about || "No details provided."}
            </p>
          </div>

          {/* Statistics Section */}
          <div className={styles["stats-container"]}>
            <div className={styles["stat-item"]}>
              <p className={styles["stat-number"]}>{user.totalPosts}</p>
              <p className={styles["stat-label"]}>Posts</p>
            </div>
            <div className={styles["stat-item"]}>
              <p className={styles["stat-number"]}>{user.totalLikes}</p>
              <p className={styles["stat-label"]}>Likes</p>
            </div>
            <div className={styles["stat-item"]}>
              <p className={styles["stat-number"]}>{user.totalFollowers}</p>
              <p className={styles["stat-label"]}>Followers</p>
            </div>
            <div className={styles["stat-item"]}>
              <p className={styles["stat-number"]}>{user.totalFollowings}</p>
              <p className={styles["stat-label"]}>Following</p>
            </div>
          </div>

          {/* Conditionally render Friend and Message buttons when viewing another user's profile */}
          {Number(loggedInUserId) !== Number(user.id) && (
            <div className={styles["buttons-container"]}>
              {/* Add Friend Button */}
              <button
                onClick={handleFollowToggle}
                className={`${styles["add-friend-btn"]} ${
                  isFollowed ? styles["followed"] : ""
                }`}
              >
                {isFollowed
                  ? user.isPrivate
                    ? "Friend request sent"
                    : "Friend added"
                  : "Add Friend"}
              </button>

              {/* Message Button */}
              <button
                onClick={handleMessageClick}
                className={styles["message-btn"]}
              >
                Message
              </button>
            </div>
          )}

          {/* See Post Button */}
          <div className={styles["see-post-container"]}>
            <button className={styles["see-post-btn"]} onClick={handleSeePosts}>
              See Post <MdKeyboardDoubleArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
