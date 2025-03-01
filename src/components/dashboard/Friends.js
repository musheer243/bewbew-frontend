import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "../../styles/Friends.css";
import { API_BASE_URL } from "../../config";

const Friends = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwtToken");
  const userId = localStorage.getItem("userId");

  // General state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("followers");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Popup for confirmation (used for remove follower, unfollow, or remove close friend)
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(""); // "removeFollower", "unfollow", or "removeCloseFriend"

  // Modal for adding close friends
  const [showAddCloseFriendsModal, setShowAddCloseFriendsModal] = useState(false);
  const [selectedCloseFriendIds, setSelectedCloseFriendIds] = useState([]);

  const routerLocation = useLocation();

  
  
  useEffect(() => {
    if (routerLocation.state && routerLocation.state.initialTab) {
      setActiveTab(routerLocation.state.initialTab);
    }
  }, [routerLocation.state]);

  // Fetch logged-in user details
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

  // Fetch friends lists: followers, following, and close friends
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
        // Mark each following user as followed
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

  useEffect(() => {
    if (userId) {
      fetchLoggedInUser();
      fetchFriends();
    }
  }, [userId, fetchLoggedInUser, fetchFriends]);

  // Filter function based on search term
  const filterFriends = (friends) =>
    friends.filter((friend) =>
      (friend.username || friend.name).toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleTabClick = (tab) => setActiveTab(tab);
  const handleFriendClick = (friend) => navigate(`/profile/${friend.id}`, { state: { user: friend } });

  // --- Followers Tab Actions ---
  // Remove follower using the provided API endpoint
  const handleRemoveFollower = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/follow/${userId}/remove-follower/${selectedUser.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        alert("Follower removed successfully!");
        fetchFriends();
      } else {
        console.error("Failed to remove follower");
      }
    } catch (error) {
      console.error("Error removing follower:", error);
    }
    setShowConfirmPopup(false);
    setSelectedUser(null);
  };

  // --- Following Tab Action (Unfollow) ---
  const handleUnfollow = async () => {
    if (!selectedUser) return;
    try {
      const friendId = selectedUser.id;
      const response = await fetch(`${API_BASE_URL}/api/follow/${userId}/unfollow/${friendId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        alert("Unfollowed successfully!");
        setFollowing((prev) =>
          prev.map((f) => (f.id === friendId ? { ...f, isFollowing: false } : f))
        );
        fetchLoggedInUser();
        fetchFriends();
      } else {
        console.error("Failed to unfollow");
      }
    } catch (error) {
      console.error("Error unfollowing friend:", error);
    }
    setShowConfirmPopup(false);
    setSelectedUser(null);
  };

  // --- Close Friends Tab Action (Remove Close Friend) ---
  const handleRemoveCloseFriend = async (friendId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/closefriend/${userId}/${friendId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        alert("Close friend removed successfully!");
        fetchFriends();
      } else {
        console.error("Failed to remove close friend");
      }
    } catch (error) {
      console.error("Error removing close friend:", error);
    }
    setShowConfirmPopup(false);
    setSelectedUser(null);
  };

  // Determine the message for the confirmation popup based on the action
  const getPopupMessage = () => {
    if (confirmAction === "removeFollower") {
      return `Are you sure you want to remove ${selectedUser.username} from your followers?`;
    } else if (confirmAction === "unfollow") {
      return `Are you sure you want to unfollow ${selectedUser.username}?`;
    } else if (confirmAction === "removeCloseFriend") {
      return `Are you sure you want to remove ${selectedUser.username} from your close friends?`;
    }
    return "";
  };

  // Handle confirmation popup action based on action type
  const handleConfirm = () => {
    if (confirmAction === "removeFollower") {
      handleRemoveFollower();
    } else if (confirmAction === "unfollow") {
      handleUnfollow();
    } else if (confirmAction === "removeCloseFriend") {
      handleRemoveCloseFriend(selectedUser.id);
    }
  };

  // --- Modal for Adding Close Friends ---
  // Toggle selection for close friends to add (using checkboxes)
  const toggleSelection = (friendId) => {
    setSelectedCloseFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const addCloseFriends = async () => {
    try {
      const friendIds = selectedCloseFriendIds.map(id => Number(id));
      // Build the query string, e.g., friendIds=1&friendIds=2&friendIds=3
      const queryParams = friendIds.map(id => `friendIds=${id}`).join('&');
      const response = await fetch(`${API_BASE_URL}/api/closefriend/${userId}?${queryParams}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // You can remove this header if there's no JSON body
        }
      });
      if (response.ok) {
        alert("Close friends added successfully!");
        setShowAddCloseFriendsModal(false);
        setSelectedCloseFriendIds([]);
        fetchFriends();
      } else {
        console.error("Failed to add close friends");
      }
    } catch (error) {
      console.error("Error adding close friends:", error);
    }
  };
  
  // Determine which list of friends to display based on the active tab
  let displayedFriends = [];
  if (activeTab === "followers") {
    displayedFriends = filterFriends(followers);
  } else if (activeTab === "following") {
    displayedFriends = filterFriends(following);
  } else if (activeTab === "close") {
    displayedFriends = filterFriends(closeFriends);
  }

  
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

      // Refresh profile and friends lists
      fetchLoggedInUser();
      fetchFriends();
    } else {
      console.error("Failed to follow");
    }
  } catch (error) {
    console.error("Error following friend:", error);
  }
};


  return (
    <div className="search-container">
      {/* Header Section */}
      <header className="friends-search-header">
  <div className="friend-back-button" onClick={() => navigate("/dashboard")}>
    <FaArrowLeft className="back-icon" />
  </div>
  <input
    type="text"
    className="friends-search-input"
    placeholder="Search friends"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</header>


      {/* Tabs for Followers, Following, and Close Friend */}
      <div className="search-tabs">
        <button className={`search-tab ${activeTab === "followers" ? "active" : ""}`} onClick={() => handleTabClick("followers")}>
          Followers
        </button>
        <button className={`search-tab ${activeTab === "following" ? "active" : ""}`} onClick={() => handleTabClick("following")}>
          Following
        </button>
        <button className={`search-tab ${activeTab === "close" ? "active" : ""}`} onClick={() => handleTabClick("close")}>
          Close Friend
        </button>
      </div>

      {/* Always show Add Close Friends button in Close tab */}
      {activeTab === "close" && (
        <div className="add-close-friend-container">
          <button className="add-close-friend-btn" onClick={() => setShowAddCloseFriendsModal(true)}>
            Add Close Friends
          </button>
        </div>
      )}

      {/* --- Close Friends Tab List --- */}
      {activeTab === "close" && closeFriends.length > 0 && (
        <div className="search-results">
          <ul className="results-list">
            {displayedFriends.map((friend) => (
              <li key={friend.id} className="result-item">
                <div className="result-user" onClick={() => handleFriendClick(friend)}>
                  <img
                    src={friend.profilepic || "https://via.placeholder.com/40"}
                    alt={friend.username || "User"}
                    className="result-user-pic"
                  />
                  <span className="result-username">{friend.username || friend.name}</span>
                </div>
                <button
                  className="follow-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUser(friend);
                    setConfirmAction("removeCloseFriend");
                    setShowConfirmPopup(true);
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Followers Tab --- */}
      {activeTab === "followers" && (
        <div className="search-results">
          {displayedFriends.length === 0 ? (
            <p className="no-results">No followers found.</p>
          ) : (
            <ul className="results-list">
              {displayedFriends.map((friend) => (
                <li key={friend.id} className="result-item">
                  <div className="result-user" onClick={() => handleFriendClick(friend)}>
                    <img
                      src={friend.profilepic || "https://via.placeholder.com/40"}
                      alt={friend.username || "User"}
                      className="result-user-pic"
                    />
                    <span className="result-username">{friend.username || friend.name}</span>
                  </div>
                  <button
                    className="follow-toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(friend);
                      setConfirmAction("removeFollower");
                      setShowConfirmPopup(true);
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* --- Following Tab --- */}
      {activeTab === "following" && (
        <div className="search-results">
          {displayedFriends.length === 0 ? (
            <p className="no-results">No followings found.</p>
          ) : (
            <ul className="results-list">
              {displayedFriends.map((friend) => {
                const friendFollowStatus =
                  following.find((f) => f.id === friend.id && f.isFollowing !== false) || null;
                let buttonText = "";
                let buttonAction = (e) => e.stopPropagation();

                if (friendFollowStatus) {
                  buttonText = "Unfollow";
                  buttonAction = (e) => {
                    e.stopPropagation();
                    setSelectedUser(friend);
                    setConfirmAction("unfollow");
                    setShowConfirmPopup(true);
                  };
                } else {
                  buttonText = "Add Friend";
                  buttonAction = (e) => {
                    e.stopPropagation();
                    handleFollow(friend.id);
                  };
                }

                return (
                  <li key={friend.id} className="result-item">
                    <div className="result-user" onClick={() => handleFriendClick(friend)}>
                      <img
                        src={friend.profilepic || "https://via.placeholder.com/40"}
                        alt={friend.username || "User"}
                        className="result-user-pic"
                      />
                      <span className="result-username">{friend.username || friend.name}</span>
                    </div>
                    <button className="follow-toggle-btn" onClick={buttonAction}>
                      {buttonText}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* --- Modal for Adding Close Friends --- */}
      {showAddCloseFriendsModal && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Select Followers to Add as Close Friends</h3>
            <ul className="results-list">
              {followers
                .filter((friend) => !closeFriends.some((cf) => cf.id === friend.id))
                .map((friend) => (
                  <li key={friend.id} className="result-item">
                    <div className="result-user" onClick={() => toggleSelection(friend.id)}>
                      <input
                        type="checkbox"
                        checked={selectedCloseFriendIds.includes(friend.id)}
                        onChange={() => toggleSelection(friend.id)}
                      />
                      <img
                        src={friend.profilepic || "https://via.placeholder.com/40"}
                        alt={friend.username || "User"}
                        className="result-user-pic"
                      />
                      <span className="result-username">{friend.username || friend.name}</span>
                    </div>
                  </li>
                ))}
            </ul>
            <button className="follow-toggle-btn" onClick={addCloseFriends}>
              Add
            </button>
            <button
              className="cancel-btn"
              onClick={() => {
                setShowAddCloseFriendsModal(false);
                setSelectedCloseFriendIds([]);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* --- Confirmation Popup --- */}
      {showConfirmPopup && selectedUser && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>{getPopupMessage()}</p>
            <button className="confirm-btn" onClick={handleConfirm}>
              Yes
            </button>
            <button
              className="cancel-btn"
              onClick={() => {
                setShowConfirmPopup(false);
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
