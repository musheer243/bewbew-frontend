import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/Leaderboard.css"; // Import the CSS file
import { FaArrowLeft, FaChevronDown, FaMedal } from "react-icons/fa";
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
      let url = `${API_BASE_URL}/api/leaderboard/monthly`;
      if (selectedMonth !== "current") {
        url = `${API_BASE_URL}/api/leaderboard/previous/${selectedMonth}`;
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
      {/* Header Section */}
      <div className="leaderboard-header">
        <FaArrowLeft className="leaderboard-back-button" onClick={() => navigate(-1)} />
        <h2>Leaderboard</h2>

        <div className="month-selector">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="current">This Month</option>
            <option value="1">1 Month Ago</option>
            <option value="2">2 Months Ago</option>
            {/* <option value="3">3 Months Ago</option> */}
          </select>
          <FaChevronDown className="dropdown-icon" />
        </div>
      </div>

      <div className="leaderboard-table-container">
        {leaderboard.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Total Posts</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => {
                const rank = index + 1;

                // Assign medal for top 3
                let medalIcon = null;
                if (rank === 1) {
                  medalIcon = (
                    <FaMedal style={{ color: "#FFD700", marginLeft: "5px" }} />
                  );
                } else if (rank === 2) {
                  medalIcon = (
                    <FaMedal style={{ color: "#C0C0C0", marginLeft: "5px" }} />
                  );
                } else if (rank === 3) {
                  medalIcon = (
                    <FaMedal style={{ color: "#CD7F32", marginLeft: "5px" }} />
                  );
                }

                return (
                  <tr key={user.id || index}>
                    <td>
                      {rank}
                      {medalIcon}
                    </td>
                    <td className="username-cell">
                      {user.profilePic && (
                        <img
                          src={user.profilePic}
                          alt="Profile"
                          className="table-profile-pic"
                        />
                      )}
                      {user.username}
                    </td>
                    <td>{user.postCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="no-data">No data available</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
