import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "../../styles/Friends.css";
import { API_BASE_URL } from "../../config";

const Friends = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwtToken");
  const userId = localStorage.getItem("userId"); // Logged-in user's ID

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Active tab: "followers", "following", or "close"
  const [activeTab, setActiveTab] = useState("followers");

  // States for friends lists and logged-in user's profile
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // State for confirmation popup when unfollowing
  const [showUnfollowPopup, setShowUnfollowPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch logged-in user details (cached profile)
  const fetchLoggedInUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setLoggedInUser(userData);
      } else {
        console.error("Failed to fetch logged-in user details");
      }
    } catch (error) {
      console.error("Error fetching logged-in user:", error);
    }
  }, [userId, token]);

  // Fetch friends lists
  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    try {
      const [resFollowers, resFollowing, resCloseFriends] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/${userId}/myfollowers`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/api/users/${userId}/myfollowings`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/api/closefriend/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (resFollowers.ok) {
        const dataFollowers = await resFollowers.json();
        setFollowers([...dataFollowers]);
      } else {
        console.error("Failed to fetch followers");
      }

      if (resFollowing.ok) {
        const dataFollowing = await resFollowing.json();
        // All fetched following users are considered as followed
        setFollowing([...dataFollowing.map(friend => ({ ...friend, isFollowing: true }))]);
      } else {
        console.error("Failed to fetch following");
      }

      if (resCloseFriends.ok) {
        const dataCloseFriends = await resCloseFriends.json();
        setCloseFriends([...dataCloseFriends]);
      } else {
        console.error("Failed to fetch close friends");
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  }, [userId, token]);

  // On mount, fetch profile and friends
  useEffect(() => {
    if (userId) {
      fetchLoggedInUser();
      fetchFriends();
    }
  }, [userId, fetchLoggedInUser, fetchFriends]);

  // Filter friends based on search term
  const filterFriends = (friends) =>
    friends.filter((friend) =>
      (friend.username || friend.name)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  // Handler for changing tabs
  const handleTabClick = (tab) => setActiveTab(tab);

  // Navigate to profile of clicked friend
  const handleFriendClick = (friend) => {
    navigate(`/profile/${friend.id}`, { state: { user: friend } });
  };

  // Handle following a user using your provided API
  const handleFollow = async (friendId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/follow/${userId}/follow/${friendId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        alert("Followed successfully!");

        // Update the following list: set isFollowing = true (or add friend if not present)
        setFollowing((prevFollowing) => {
          const index = prevFollowing.findIndex((f) => f.id === friendId);
          if (index !== -1) {
            const updated = [...prevFollowing];
            updated[index] = { ...updated[index], isFollowing: true };
            return updated;
          } else {
            const friendFromFollowers = followers.find((f) => f.id === friendId);
            if (friendFromFollowers) {
              return [...prevFollowing, { ...friendFromFollowers, isFollowing: true }];
            }
          }
          return prevFollowing;
        });

        // After a successful follow, update the cached profile and friends lists
        fetchLoggedInUser();
        fetchFriends();
      } else {
        console.error("Failed to follow");
      }
    } catch (error) {
      console.error("Error following friend:", error);
    }
  };

  // Handle unfollowing a user via confirmation popup using your provided API
  const handleUnfollow = async () => {
    if (!selectedUser) return;
    try {
      const friendId = selectedUser.id;
      const response = await fetch(
        `${API_BASE_URL}/api/follow/${userId}/unfollow/${friendId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        alert("Unfollowed successfully!");
        // Update following list: set isFollowing to false for that friend
        setFollowing((prevFollowing) =>
          prevFollowing.map((f) =>
            f.id === friendId ? { ...f, isFollowing: false } : f
          )
        );
        // Also update the followers list if needed (if the follow status is stored there)
        // For simplicity, we'll refetch the friends and profile data
        fetchLoggedInUser();
        fetchFriends();
      } else {
        console.error("Failed to unfollow");
      }
      setShowUnfollowPopup(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error unfollowing friend:", error);
    }
  };

  // Determine which list to display based on the active tab
  let displayedFriends = [];
  if (activeTab === "followers") {
    displayedFriends = filterFriends(followers);
  } else if (activeTab === "following") {
    displayedFriends = filterFriends(following);
  } else if (activeTab === "close") {
    displayedFriends = filterFriends(closeFriends);
  }

  return (
    <div className="search-container">
      {/* Header Section */}
      <header className="search-header">
        <div className="back-button" onClick={() => navigate("/dashboard")}>
          <FaArrowLeft className="back-icon" />
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search friends"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* Tabs for Followers, Following, and Close Friend */}
      <div className="search-tabs">
        <button
          className={`search-tab ${activeTab === "followers" ? "active" : ""}`}
          onClick={() => handleTabClick("followers")}
        >
          Followers
        </button>
        <button
          className={`search-tab ${activeTab === "following" ? "active" : ""}`}
          onClick={() => handleTabClick("following")}
        >
          Following
        </button>
        <button
          className={`search-tab ${activeTab === "close" ? "active" : ""}`}
          onClick={() => handleTabClick("close")}
        >
          Close Friend
        </button>
      </div>

      {/* "Add Close Friend" Button List - Appears only in Close Friend tab */}
      {activeTab === "close" && (
        <div className="add-close-friend-container">
          <h3>Add Close Friend</h3>
          <ul className="results-list">
            {followers
              .filter((friend) => !closeFriends.some((cf) => cf.id === friend.id))
              .map((friend) => (
                <li key={friend.id} className="result-item">
                  <div className="result-user" onClick={() => handleFriendClick(friend)}>
                    <img
                      src={friend.profilepic || "https://via.placeholder.com/40"}
                      alt={friend.username || "User"}
                      className="result-user-pic"
                    />
                    <span className="result-username">
                      {friend.username || friend.name}
                    </span>
                  </div>
                  <button
                    className="add-close-friend-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      (async () => {
                        try {
                          const response = await fetch(
                            `${API_BASE_URL}/api/closefriend/${userId}`,
                            {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify([friend.id]),
                            }
                          );
                          if (response.ok) {
                            alert("Friend added to Close Friends successfully!");
                            // Optionally, refresh the close friends list
                            fetchFriends();
                          } else {
                            console.error("Failed to add close friend");
                          }
                        } catch (error) {
                          console.error("Error adding close friend:", error);
                        }
                      })();
                    }}
                  >
                    Add
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Friends List Section (Followers & Following) */}
      {(activeTab === "followers" || activeTab === "following") && (
        <div className="search-results">
          {displayedFriends.length === 0 ? (
            <p className="no-results">No friends found.</p>
          ) : (
            <ul className="results-list">
              {displayedFriends.map((friend) => {
                // For followers tab, we determine if the friend is followed by checking if they appear in the following list
                const friendFollowStatus =
                  following.find((f) => f.id === friend.id && f.isFollowing !== false) || null;
                let buttonText = "";
                let buttonAction = (e) => e.stopPropagation();

                if (activeTab === "followers") {
                  if (friendFollowStatus) {
                    buttonText = "Unfollow";
                    buttonAction = (e) => {
                      e.stopPropagation();
                      setSelectedUser(friend);
                      setShowUnfollowPopup(true);
                    };
                  } else {
                    buttonText = "Follow";
                    buttonAction = (e) => {
                      e.stopPropagation();
                      handleFollow(friend.id);
                    };
                  }
                } else if (activeTab === "following") {
                  if (friend.isFollowing !== false) {
                    buttonText = "Unfollow";
                    buttonAction = (e) => {
                      e.stopPropagation();
                      setSelectedUser(friend);
                      setShowUnfollowPopup(true);
                    };
                  } else {
                    buttonText = "Add Friend";
                    buttonAction = (e) => {
                      e.stopPropagation();
                      handleFollow(friend.id);
                    };
                  }
                }

                return (
                  <li key={friend.id} className="result-item">
                    <div className="result-user" onClick={() => handleFriendClick(friend)}>
                      <img
                        src={friend.profilepic || "https://via.placeholder.com/40"}
                        alt={friend.username || "User"}
                        className="result-user-pic"
                      />
                      <span className="result-username">
                        {friend.username || friend.name}
                      </span>
                    </div>
                    {(activeTab === "followers" || activeTab === "following") && (
                      <button className="follow-toggle-btn" onClick={buttonAction}>
                        {buttonText}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Unfollow Confirmation Popup */}
      {showUnfollowPopup && selectedUser && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>
              Are you sure you want to unfollow <strong>{selectedUser.username}</strong>?
            </p>
            <button className="confirm-btn" onClick={handleUnfollow}>
              Yes, Unfollow
            </button>
            <button
              className="cancel-btn"
              onClick={() => {
                setShowUnfollowPopup(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
