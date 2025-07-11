import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { MdDarkMode, MdOutlineLightMode } from "react-icons/md";
import { BiLogOut } from "react-icons/bi";
import "../../styles/Dashboard.css"; // Import the CSS file
import { CiSearch } from "react-icons/ci";
import { FaRegUser } from "react-icons/fa";
import { FaUsers } from "react-icons/fa6";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { RiRobot2Fill } from "react-icons/ri";
import { LiaToolsSolid } from "react-icons/lia";
import { TfiGallery } from "react-icons/tfi";
import SinglePost from "../shared/SinglePost";
import { BiImageAdd } from "react-icons/bi";
import { API_BASE_URL } from "../../config";
import { IoIosNotificationsOutline } from "react-icons/io";
import { LuMessageCircleHeart } from "react-icons/lu";
import { WebSocketContext } from "../../context/WebSocketContext"; // Import the context
import { MdLeaderboard } from "react-icons/md";
import AdSenseComponent from "../../AdSenseComponent";

const Dashboard = () => {
  const [profile, setProfile] = useState(null); // State to store profile data
  const [darkMode, setDarkMode] = useState(false); // State for dark mode
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar starts closed by default
  const [posts, setPosts] = useState([]); // State to store posts data
  const [loading, setLoading] = useState(false); // State to handle loading status
  const [error, setError] = useState(null); // State to handle errors
  const [pageNumber, setPageNumber] = useState(0); // State to manage pagination
  const [totalPages, setTotalPages] = useState(1); // Total pages for pagination
  const postsContainerRef = useRef(null); // Reference for the posts container
  const navigate = useNavigate();
  const location = useLocation();
  const { notificationCount, unreadChatCount } = useContext(WebSocketContext);

  // ********** New Post Integration **********
  // If a new post is passed via navigation state, add it to the posts list.
  useEffect(() => {
    if (location.state?.newPost) {
      setPosts((prevPosts) => {
        const newPost = location.state.newPost;
        // Only add if it does not already exist
        if (prevPosts.some((post) => post.postId === newPost.postId)) {
          return prevPosts;
        }
        return [newPost, ...prevPosts];
      });
      // Clear the location state so the new post isn't added again on reload.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);
  // ******************************************

  // Handle infinite scrolling
  const handleScroll = useCallback(
    (e) => {
      const bottom =
        e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
      if (bottom && !loading && pageNumber < totalPages - 1) {
        setPageNumber((prevPageNumber) => prevPageNumber + 1);
      }
    },
    [loading, pageNumber, totalPages]
  );

  // Fetch posts function with useCallback
  // ...
// Within your Dashboard.js

// 1) Remove the recommendation logic in fetchPosts.
const fetchPosts = useCallback(async () => {
  try {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("jwtToken");
    if (!userId || !token) {
      setError("User ID or token is missing.");
      return;
    }

    setLoading(true);

    // Fetch posts from followed users
    const response = await axios.get(
      `${API_BASE_URL}/api/post/byfollowing/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          pageNumber: pageNumber,
          pageSize: 10,
          sortBy: "addedDate",
          sortDir: "desc",
        },
      }
    );

    if (response.status === 200) {
      const newPosts = response.data.content || [];

      // 2) If no posts and we are on page 0 => just empty
      if (newPosts.length === 0 && pageNumber === 0) {
        setPosts([]);
        setTotalPages(1); // so we don't keep trying to fetch more
      } else {
        // If there are posts, merge them in
        setPosts((prevPosts) => [
          ...prevPosts.filter(
            (post) =>
              !newPosts.some((newPost) => newPost.postId === post.postId)
          ),
          ...newPosts,
        ]);
        setTotalPages(response.data.totalPages);
      }
    } else {
      setError("Failed to fetch posts.");
    }
  } catch (err) {
    console.error("Error fetching posts:", err);
    setError("An error occurred while fetching posts.");
  } finally {
    setLoading(false);
  }
}, [pageNumber]);

  // Trigger fetchPosts when pageNumber changes
  useEffect(() => {
    fetchPosts();
  }, [pageNumber, fetchPosts]);

  // Detect when the user reaches the bottom of the page
  useEffect(() => {
    const postContainer = postsContainerRef.current;
    if (postContainer) {
      postContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (postContainer) {
        postContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("jwtToken");

        if (!userId || !token) {
          console.error("User ID or token is missing!");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          const profileData = response.data;
          setProfile(profileData);
          const userPrefersDark = profileData.userPreference === "dark";
          setDarkMode(userPrefersDark);
          localStorage.setItem("cachedProfile", JSON.stringify(profileData));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    const cachedProfile = localStorage.getItem("cachedProfile");
    if (cachedProfile) {
      const parsedProfile = JSON.parse(cachedProfile);
      setProfile(parsedProfile);
      const userPrefersDark = parsedProfile.userPreference === "dark";
      setDarkMode(userPrefersDark);
    } else {
      fetchProfileData();
    }
  }, []);

  const handleGoToProfile = () => {
    if (profile) {
      navigate("/profile", { state: { user: profile } });
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newPreference = darkMode ? "light" : "dark"; // Toggle preference

      const token = localStorage.getItem("jwtToken");
      if (!profile || !token) {
        console.error("User profile or token is missing!");
        return;
      }

      // Optimistically update the UI
      setDarkMode(!darkMode);
      const updatedProfile = { ...profile, userPreference: newPreference };
      setProfile(updatedProfile); // Update state
      localStorage.setItem("cachedProfile", JSON.stringify(updatedProfile)); // Update cache

      // Update the preference via API
      await axios.put(
        `${API_BASE_URL}/api/users/update-preference`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            email: profile.email,
            preference: newPreference,
          },
        }
      );

      console.log("Preference updated successfully!");
    } catch (error) {
      console.error("Error updating user preference:", error);
      // Roll back the UI if needed
      setDarkMode(darkMode);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

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

  useEffect(() => {
    // Sync darkMode state with the document's body class
    if (darkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // if (loading && pageNumber === 0) return <div>Loading...</div>;
  // if (error) return <div className="error">{error}</div>;

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : "light"}`}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="brand">BewBew</div>
        <div className="navbar-controls">
          <button onClick={toggleDarkMode} className="dark-mode-toggle">
            {darkMode ? <MdDarkMode /> : <MdOutlineLightMode />}
          </button>

          <CiSearch
            size={27}
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/search")}
          />
          {/* Notification Icon with Badge */}
          <div
            style={{
              position: "relative",
              display: "inline-block",
              cursor: "pointer",
            }}
            onClick={() => {
              // Simply navigate to notifications without clearing the count
              navigate("/notifications");
            }}
          >
            <IoIosNotificationsOutline size={27} />
            {notificationCount > 0 && (
              <span className="badge">{notificationCount}</span>
            )}
          </div>

          {profile && (
            <div className="profile" onClick={handleGoToProfile}>
              <img
                src={profile.profilepic}
                alt="Profile"
                className="ds-profile-pic"
              />
              {/* <span className="profile-name">{profile.name}</span> */}
            </div>
          )}
        </div>
      </nav>

      {/* Search Bar */}
      {/* <div className="search-bar">
        <div className="search-input-container">
          <CiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users, posts"
            className="search-input"
          />
        </div>
      </div> */}

      {/* Posts Section */}
      <div className="posts-section" ref={postsContainerRef}>
        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        {/* Loading indicator for initial load */}
        {loading && posts.length === 0 && (
          <div className="loading-indicator">Loading...</div>
        )}

        {/* Display posts with an ad after every 4 posts */}
        {posts.length > 0
          ? posts.map((post, index) => (
              <React.Fragment key={post.postId}>
                <SinglePost post={post} darkModeFromDashboard={darkMode} />
                {(index + 1) % 4 === 0 && <AdSenseComponent />}
              </React.Fragment>
            ))
          : !loading && <p className="no-posts-message">No posts available</p>}

        {/* Loading indicator for additional posts (infinite scroll) */}
        {loading && posts.length > 0 && (
          <div className="loading-indicator">Loading more posts...</div>
        )}

        {/* Floating Chat Button */}
        <div className="add-post-container">
          <button className="add-post-btn" onClick={() => navigate("/chat")}>
            <LuMessageCircleHeart size={34} />
            {unreadChatCount > 0 && (
              <span className="badge">{unreadChatCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`sidebar-toggle ${isSidebarOpen ? "open" : ""}`}
      >
        {isSidebarOpen ? (
          <GoSidebarExpand size={24} />
        ) : (
          <GoSidebarCollapse size={24} />
        )}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <ul className="sidebar-menu">
          {[
            {
              name: "Leaderboard",
              icon: <MdLeaderboard size={20} />,
              onClick: () => navigate("/leaderboard"),
            },
            {
              name: "Profile",
              icon: <FaRegUser size={20} />,
              onClick: handleGoToProfile,
            },
            {
              name: "Friends",
              icon: <FaUsers size={20} />,
              onClick: () => navigate("/friends"),
            },
            {
              name: "Notifications",
              icon: <MdOutlineNotificationsActive size={20} />,
              onClick: () => navigate("/notifications"),
            },
            {
              name: "Ask AI",
              icon: <RiRobot2Fill size={20} />,
              onClick: () => navigate("/ai-chatting"),
            },
            {
              name: "Settings",
              icon: <LiaToolsSolid size={20} />,
              onClick: () => navigate("/setting"),
            },
            {
              name: "My Posts",
              icon: <TfiGallery size={20} />,
              onClick: () => {
                const loggedInUserId = localStorage.getItem("userId");
                navigate(`/my-posts`, {
                  state: { userId: loggedInUserId, darkMode },
                });
              },
            },

            {
              name: "Create Post",
              icon: <BiImageAdd size={20} />,
              onClick: () => navigate("/create-post"),
            },
          ].map((item, index) => (
            <li key={index} className="sidebar-item" onClick={item.onClick}>
              {item.icon && <span className="icon">{item.icon}</span>}
              <span className="text">{item.name}</span>
            </li>
          ))}
        </ul>
        <button onClick={handleLogout} className="logout-button">
          <BiLogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
