import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { MdDarkMode, MdOutlineLightMode } from "react-icons/md";
import { BiLogOut } from "react-icons/bi";

const Dashboard = () => {
  const [profile, setProfile] = useState(null); // State to store profile data
  const [darkMode, setDarkMode] = useState(false); // State for dark mode
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar starts closed by default
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

        const response = await axios.get(
          `http://34.227.206.93:9090/api/users/${userId}`,
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
        "http://34.227.206.93:9090/api/users/update-preference",
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
        "http://34.227.206.93:9090/api/v1/auth/logout", // Replace with your logout endpoint
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

  return (
    <div
      style={{
        backgroundColor: darkMode ? "#222" : "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 20px",
          backgroundColor: darkMode ? "#333" : "white",
          color: darkMode ? "white" : "black",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
          height: "50px",
        }}
      >
        <div style={{ fontSize: "24px", fontWeight: "bold" }}>BewBew</div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap:"nowrap", }}>
          <button
            onClick={toggleDarkMode}
            style={{
              border: "0", // Ensures no border
              outline: "none", // Removes focus outline (optional)
              background: "transparent",
              cursor: "pointer",
              fontSize: "20px",
              color: darkMode ? "yellow" : "#333",
            }}
          >
            {darkMode ? <MdDarkMode /> : <MdOutlineLightMode />}
          </button>
          {profile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
              onClick={handleGoToProfile}
            >
              <img
                src={profile.profilepic}
                alt="Profile"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                {profile.name}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Search Bar */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          width: "100%",
          zIndex: 999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "3px",
          padding: "10px 0", // Adds consistent padding
          backgroundColor: darkMode ? "#222" : "#f9f9f9", // Match container to theme
        }}
      >
        <input
          type="text"
          placeholder="Search users, posts"
          style={{
            width: "50%", // Adjust the width for responsiveness
            maxWidth: "650px", // Limit the maximum width
            padding: "10px 20px",
            borderRadius: "30px",
            border: "1px solid #ccc",
            outline: "none",
            backgroundColor: darkMode ? "#555" : "white",
            color: darkMode ? "white" : "black",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Adds subtle shadow
          }}
        />
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "fixed",
          top: "60px", // Just below the navbar
          left: isSidebarOpen ? "200px" : "10px", // Swaps position when toggled
          border: "none",
          background: darkMode ? "#555" : "white",
          color: darkMode ? "white" : "black",
          padding: "10px",
          borderRadius: "50%",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
          zIndex: 1100,
          transition: "left 0.3s ease", // Smooth transition for the button position
        }}
      >
        {isSidebarOpen ? (
          <GoSidebarExpand size={24} />
        ) : (
          <GoSidebarCollapse size={24} />
        )}
      </button>

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: "50px",
          left: isSidebarOpen ? "0" : "-250px", // Sidebar starts off-screen
          width: "250px",
          height: "calc(100% - 50px)",
          backgroundColor: darkMode ? "#444" : "#fff",
          boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
          color: darkMode ? "white" : "black",
          padding: "20px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          transition: "left 0.3s ease",
        }}
      >
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[
            { name: "Home", onClick: () => navigate("/dashboard") },
            { name: "Profile", onClick: handleGoToProfile },
            { name: "Friends", onClick: () => navigate("/friends") },
            {
              name: "Notifications",
              onClick: () => navigate("/notifications"),
            },
            { name: "Ask AI", onClick: () => navigate("/ai-chatting") },
            { name: "Settings", onClick: () => navigate("/settings") },
            { name: "My Posts", onClick: () => navigate("/my-posts") },
          ].map((item, index) => (
            <li
              key={index}
              style={{
                padding: "10px 0",
                cursor: "pointer",
                borderBottom: "1px solid #ccc",
              }}
              onClick={item.onClick}
            >
              {item.name}
            </li>
          ))}
        </ul>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "auto",
            padding: "10px 20px",
            cursor: "pointer",
            border: "none",
            background: "none",
            color: darkMode ? "white" : "black",
            fontSize: "16px",
          }}
        >
          <BiLogOut size={20} /> {/* Updated icon */}
          Logout
        </button>
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            nav {
              flex-direction: column;
              align-items: flex-start;
              padding: 10px;
            }
            nav div {
              width: 100%;
            }
            .sidebar {
              width: 200px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;
