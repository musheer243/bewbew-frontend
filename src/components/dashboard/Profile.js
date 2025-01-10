import React from "react";
import { useLocation } from "react-router-dom";

const Profile = () => {
  const location = useLocation();
  const user = location.state?.user;

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
