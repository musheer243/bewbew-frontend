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
import { ToastContainer, toast } from "react-toastify";  // <-- Make sure you have react-toastify installed


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
  const [isRequested, setIsRequested] = useState(false); // <-- add this!
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
      const token = localStorage.getItem("jwtToken");
      axios
        .get(`${API_BASE_URL}/api/users/${user.id}/follow-status?viewerId=${loggedInUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          // response.data => { followStatus: "followed" | "requested" | "none", isPrivate: boolean }
          const { followStatus } = response.data;
  
          // Decide your button text based on followStatus:
          // e.g., "followed" => "Friend added"
          //       "requested" => "Friend request sent"
          //       "none" => "Add Friend"
          
          if (followStatus === "followed") {
            setIsFollowed(true);
            setIsRequested(false);
          } else if (followStatus === "requested") {
            setIsFollowed(false);
            setIsRequested(true);
          } else {
            setIsFollowed(false);
            setIsRequested(false);
          }
          
          
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

  // This function toggles follow or unfollow based on current state
  const handleFollowToggle = () => {
    // 4A) If not followed & not requested => send a follow request
    if (!isFollowed && !isRequested) {
      axios
        .post(
          `${API_BASE_URL}/api/follow/send/${loggedInUserId}/${user.id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((resp) => {
          // The server can return "Followed successfully" or "Follow request sent"
          if (resp.data === "Follow request sent") {
            // user must be private
            setIsRequested(true);
            setIsFollowed(false);
          } else if (resp.data === "Followed successfully") {
            // user is public
            setIsRequested(false);
            setIsFollowed(true);
          } else {
            console.log("Unexpected follow response:", resp.data);
          }
        })
        .catch((err) => {
          console.error("Error sending follow request:", err);
        });
    }
    // 4B) If currently 'Requested', you might want to do "cancel request" or do nothing
    else if (isRequested) {
      // You might want to implement a "cancel request" endpoint, or do nothing
      toast.info("Follow request is already pending.");
    }
    // 4C) If currently followed => do unfollow
    else if (isFollowed) {
      axios
        .post(
          `${API_BASE_URL}/api/follow/${loggedInUserId}/unfollow/${user.id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((resp) => {
          console.log(resp.data); // "Unfollowed successfully" or similar
          setIsFollowed(false);
          setIsRequested(false);
        })
        .catch((err) => {
          console.error("Error unfollowing user:", err);
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

  // Handler for "See Posts"
  const handleSeePosts = () => {
    // 1) If I'm the user => always allowed
    if (Number(loggedInUserId) === Number(user.id)) {
      navigate("/my-posts", { state: { userId: user.id } });
      return;
    }
    // 2) If user is private & not followed => show toast
    if (user.private && !isFollowed) {
      toast.error("User account is private. You cannot view their posts unless you're a friend.");
      return;
    }
    // 3) Otherwise, navigate to posts
    navigate(`/posts/${user.id}`, { state: { userId: user.id } });
  };

  // Handler for "Message"
  const handleMessageClick = () => {
    // 1) If I'm the user => no problem
    if (Number(loggedInUserId) === Number(user.id)) {
      // If user wants to message themselves, you can allow or just show a toast
      toast.info("You are viewing your own profile. Typically, you can't message yourself!");
      return;
    }
    // 2) If user is private & not followed => show toast
    if (user.private && !isFollowed) {
      toast.error("User account is private. You cannot message them unless you're a friend.");
      return;
    }
    // 3) Otherwise, navigate to the chat
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
              <button onClick={handleFollowToggle} className={styles["add-friend-btn"]}>
                {isFollowed
                  ? "Friend added"
                  : isRequested
                  ? "Requested"
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
      <ToastContainer/>
    </div>
  );
};

export default Profile;
