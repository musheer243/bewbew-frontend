import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/Leaderboard.css"; // Importing the CSS file
import { FaArrowLeft, FaChevronDown } from "react-icons/fa";
import { API_BASE_URL } from "../../config";
const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("current");

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedMonth]);

  const fetchLeaderboard = async () => {
    try {
      let url = `${ API_BASE_URL }/api/leaderboard/monthly`;
      if (selectedMonth !== "current") {
        url = `${ API_BASE_URL }/api/leaderboard/previous/${selectedMonth}`;
      }
  
      // Retrieve token from localStorage
      const token = localStorage.getItem("jwtToken");
  
      // Pass token in the request headers
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };
  

  return (
    <div className="leaderboard-container">
      {/* Back Button */}
      <div className="leaderboard-header">
    <FaArrowLeft className="back-button" onClick={() => navigate(-1)} />
    <h2>Leaderboard</h2>
  
</div>

<div className="month-selector">
    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
      <option value="current">This Month</option>
      <option value="1">1 Month Ago</option>
      <option value="2">2 Months Ago</option>
    </select>
    <FaChevronDown className="dropdown-icon" />
  </div>

      
      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {leaderboard.length > 0 ? (
          leaderboard.map((user, index) => (
            <div key={index} className="leaderboard-item">
              <img src={user.profilePic} alt="Profile" className="profile-pic" />
              <div className="user-info">
                <span className="username">{user.username}</span>
                <span className="post-count">{user.postCount} posts</span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No data available</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
