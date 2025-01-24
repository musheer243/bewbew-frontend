import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { MdDarkMode, MdOutlineLightMode } from "react-icons/md";
import { BiLogOut } from "react-icons/bi";
import "../../styles/Dashboard.css"; // Import the CSS file
import { CiSearch } from "react-icons/ci";
import { IoHomeOutline } from "react-icons/io5"; // Import the icon
import { FaRegUser } from "react-icons/fa";
import { FaUsers } from "react-icons/fa6";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { RiRobot2Fill } from "react-icons/ri";
import { LiaToolsSolid } from "react-icons/lia";
import { TfiGallery } from "react-icons/tfi";
import SinglePost from "../shared/SinglePost";
import { BiImageAdd } from "react-icons/bi";

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
  const fetchPosts = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("jwtToken");
      if (!userId || !token) {
        setError("User ID or token is missing.");
        return;
      }

      setLoading(true); // Set loading to true before the API call

      const response = await axios.get(
        `http://3.225.10.130:9090/api/post/byfollowing/${userId}`,
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
        setPosts((prevPosts) => [
          ...prevPosts.filter(
            (post) =>
              !newPosts.some((newPost) => newPost.postId === post.postId)
          ),
          ...newPosts,
        ]);
        setTotalPages(response.data.totalPages);
      } else {
        setError("Failed to fetch posts.");
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("An error occurred while fetching posts.");
    } finally {
      setLoading(false); // Set loading to false after the API call
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
          `http://3.225.10.130:9090/api/users/${userId}`,
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
        "http://3.225.10.130:9090/api/users/update-preference",
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
        navigate("/login");
        return;
      }

      // Send logout request to the backend
      await axios.post(
        "http://3.225.10.130:9090/api/v1/auth/logout", // Replace with your logout endpoint
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
          {profile && (
            <div className="profile" onClick={handleGoToProfile}>
              <img
                src={profile.profilepic}
                alt="Profile"
                className="profile-pic"
              />
              <span className="profile-name">{profile.name}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Search Bar */}
      <div className="search-bar">
        <div className="search-input-container">
          <CiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users, posts"
            className="search-input"
          />
        </div>
      </div>

      {/* Posts Section */}
      <div className="posts-section" ref={postsContainerRef}>
        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        {/* Loading indicator for initial load */}
        {loading && posts.length === 0 && (
          <div className="loading-indicator">Loading...</div>
        )}

        {/* Display posts */}
        {posts.length > 0
          ? posts.map((post) => <SinglePost key={post.postId} post={post} darkModeFromDashboard={darkMode}  />)
          : /* No posts message, only when not loading */
            !loading && <p className="no-posts-message">No posts available</p>}

        {/* Loading indicator for additional posts (infinite scroll) */}
        {loading && posts.length > 0 && (
          <div className="loading-indicator">Loading more posts...</div>
        )}

        {/* Floating Plus Button */}
  <button className="add-post-btn" onClick={() => navigate("/add-post")}>
    <BiImageAdd size={30} />
  </button>
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
              name: "Home",
              icon: <IoHomeOutline size={20} />,
              onClick: () => navigate("/dashboard"),
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
              onClick: () => navigate("/settings"),
            },
            {
              name: "My Posts",
              icon: <TfiGallery size={20} />,
              onClick: () => navigate("/my-posts", { state: { darkMode } }),
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
