import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const Profile = () => {
  const { userId } = useParams(); // Extract userId from the URL
  const location = useLocation();
  const navigate = useNavigate();
  const loggedInUserId = localStorage.getItem("userId"); // Assuming you store the logged-in user's ID in localStorage
  const token = localStorage.getItem("jwtToken"); // Retrieve JWT token from localStorage
  const [user, setUser] = useState(location.state?.user); // Use user from location.state if available
  const [loading, setLoading] = useState(!location.state?.user); // If user is not in location.state, set loading to true
  const [error, setError] = useState(null);

  useEffect(() => {
    // If no userId is provided (i.e., /profile), redirect to the logged-in user's profile
    if (!userId && loggedInUserId) {
      navigate(`/profile/${loggedInUserId}`);
      return;
    }

    // If user is not available in location.state, fetch user data from the backend
    if (!user) {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!user) {
    return <div>User data is not available.</div>;
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "50px auto",
        padding: "20px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        borderRadius: "10px",
        backgroundColor: "#fff",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src={user.profilepic}
          alt={`${user.name}'s Profile`}
          style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </div>
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>{user.name}</h2>
      <p style={{ textAlign: "center", color: "#555", marginBottom: "5px" }}>
        @{user.username}
      </p>
      <div style={{ marginBottom: "20px" }}>
        <h4>About</h4>
        <p style={{ color: "#555", lineHeight: "1.6" }}>
          {user.about || "No details provided."}
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h4>Email</h4>
        <p style={{ color: "#555" }}>{user.email}</p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h4>Account Details</h4>
        <p>Joined on: {new Date(...user.joiningdate).toLocaleDateString()}</p>
      </div>

      <div>
        <h4>Statistics</h4>
        <p>Total Posts: {user.totalPosts}</p>
        <p>Total Likes: {user.totalLikes}</p>
        <p>Total Followers: {user.totalFollowers}</p>
        <p>Total Followings: {user.totalFollowings}</p>
      </div>
    </div>
  );
};

export default Profile;