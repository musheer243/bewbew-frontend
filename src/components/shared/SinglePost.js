import React, { useState, useEffect } from "react";
import "../../styles/SinglePost.css";
import {
  // FaHeart,
  FaRegComment,
  FaBookmark,
  FaRegHeart,
  FaRegBookmark,
} from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";
import { IoIosShareAlt } from "react-icons/io";
import { HiTranslate } from "react-icons/hi";
import { PiShareFatBold } from "react-icons/pi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { API_BASE_URL } from "../../config";
import { FcLike } from "react-icons/fc";
import { IoMdClose } from "react-icons/io";
import { FaPaperPlane } from "react-icons/fa";

const SinglePost = ({ post, onDelete, onEdit, darkModeFromDashboard }) => {
  const {
    title,
    mediaFileNames = [],
    content,
    addedDate,
    user,
    likeCount: initialLikeCount,
    saveCount: initialSaveCount,
    commentCount,
  } = post;
  const { username, profilepic } = user || {};
  const [currentIndex, setCurrentIndex] = useState(0); // Track the current image index
  const [likeCount, setLikeCount] = useState(initialLikeCount || 0);
  const [saveCount, setSaveCount] = useState(initialSaveCount || 0);
  const [liked, setLiked] = useState(false); // Track if post is liked
  const [saved, setSaved] = useState(false); // Track if post is saved
  const [comment, setComment] = useState("");
  const [showOptions, setShowOptions] = useState(false); // State for dropdown
  const [showSharePopup, setShowSharePopup] = useState(false); // Share popup state
  const [shareLink, setShareLink] = useState(""); // Shareable link
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.title = "BewBew • My Posts";
  }, []);

  useEffect(() => {
    // Update the document body class whenever darkModeFromDashboard changes
    document.body.classList.toggle("dark-mode", darkModeFromDashboard);
  }, [darkModeFromDashboard]);

  useEffect(() => {
    const checkPostStatus = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          console.error("User ID or JWT token is missing.");
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/post/${post.postId}/status?userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const statusMessage = await response.text();

          // Set state based on the exact response message
          if (statusMessage === "Post is liked and saved.") {
            setLiked(true);
            setSaved(true);
          } else if (statusMessage === "Post is liked but not saved.") {
            setLiked(true);
            setSaved(false);
          } else if (statusMessage === "Post is saved but not liked.") {
            setLiked(false);
            setSaved(true);
          } else {
            setLiked(false);
            setSaved(false);
          }
        } else {
          console.error("Failed to check post status:", post.postId);
        }
      } catch (error) {
        console.error("Error checking post status:", error);
      }
    };

    checkPostStatus();
  }, [post.postId]);

  const handleLikeToggle = async () => {
    console.log("btn clicked");
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("jwtToken"); // Retrieve the token
      if (!token) {
        console.error("JWT token is missing in localStorage.");
        return;
      }

      if (!userId || !token) {
        console.error("User ID or JWT token not found in localStorage");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/post/${post.postId}/like?userId=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const message = await response.text(); // Get the string response
        if (message === "Post liked successfully!") {
          setLiked(true);
          setLikeCount((prev) => prev + 1); // Increment like count
        } else if (message === "Post unliked successfully!") {
          setLiked(false);
          setLikeCount((prev) => prev - 1); // Decrement like count
        }
        console.log(message);
      } else {
        console.error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSaveToggle = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("jwtToken"); // Retrieve the token
      if (!token || !userId) {
        console.error("User ID or JWT token is missing in localStorage.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/post/${post.postId}/save?userId=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const message = await response.text(); // Get the string response
        if (message === "Post Saved successfully!") {
          setSaved(true);
          setSaveCount((prev) => prev + 1); // Increment save count
        } else if (message === "Post UnSaved successfully!") {
          setSaved(false);
          setSaveCount((prev) => prev - 1); // Decrement save count
        }
        console.log(message);
      } else {
        console.error("Failed to toggle save");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Format addedDate (from array to readable string)
  const formattedDate = addedDate
    ? new Date(...addedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short", // Shortened month format
        day: "numeric",
      })
    : "Unknown Date";

  // Move to next image
  const nextImage = () => {
    if (currentIndex < mediaFileNames.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Move to previous image
  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
    console.log("Dropdown state:", !showOptions);
  };

  // Fetch the shareable link from the backend
  const handleShareClick = async () => {
    const frontendBaseUrl = window.location.origin; // Gets http://localhost:3000 or the deployed URL
    const shareableLink = `${frontendBaseUrl}/api/post/view/${post.postId}`;
    
    setShareLink(shareableLink);
    setShowSharePopup(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert("Link copied to clipboard!");
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Close dropdown if click is outside the menu-container
      if (!event.target.closest(".menu-container")) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSendComment = () => {
    if (comment.trim()) {
      console.log("Comment:", comment);
      setComment(""); // Clear input after sending
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setComment(""); // Clear the input when closing
  };

  const handleCommentClick = () => {
    setIsModalOpen(true);
    console.log("Modal Open:", isModalOpen);
  };

  return (
    <div className="single-post-container">
      <div className="single-post">
        {/* Post Header */}
        <div className="post-header">
          <div className="user-info">
            <img src={profilepic} alt="Profile" className="profile-pic" />
            <span className="username">{username}</span>
          </div>
          <div className="menu-container">
            <button className="menu-btn" onClick={toggleOptions}>
              <BsThreeDotsVertical />
            </button>
            <div className={`dropdown-menu ${showOptions ? "show" : ""}`}>
              <button className="dropdown-item">
                <MdEdit style={{ marginRight: "8px" }} />
                Edit
              </button>
              <button className="dropdown-item">
                <IoIosShareAlt style={{ marginRight: "8px" }} />
                Share
              </button>
              <button className="dropdown-item">
                <HiTranslate style={{ marginRight: "8px" }} />
                Translate
              </button>
              <button className="dropdown-item">
                <MdDelete style={{ marginRight: "8px" }} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="post-header-divider"></div>

        <h2 className="post-title" style={{ fontSize: "20px" }}>
          {title}
        </h2>

        <div className="post-media">
          {mediaFileNames.length > 0 && (
            <div className="media-container">
              <div className="aspect-ratio-box">
                {/* Check if the current media is a video or an image */}
                {mediaFileNames[currentIndex].endsWith(".mp4") ? (
                  <video
                    controls
                    src={mediaFileNames[currentIndex]}
                    className="media-video"
                  />
                ) : (
                  <img
                    src={mediaFileNames[currentIndex]}
                    alt={`Media ${currentIndex + 1}`}
                    className="main-image"
                  />
                )}
              </div>

              {mediaFileNames.length > 1 && (
                <>
                  <button className="prev-btn" onClick={prevImage}>
                    ←
                  </button>
                  <button className="next-btn" onClick={nextImage}>
                    →
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <p className="post-content">{content}</p>

        <div className="post-footer">
          <div className="post-buttons">
            <button
              className="like-btn"
              onClick={handleLikeToggle}
              //style={{ color: liked ? "red" : "black" }}
            >
              {liked ? <FcLike /> : <FaRegHeart />}
              <span className="count">{likeCount}</span>
            </button>
            <button className="comment-btn" onClick={handleCommentClick}>
              <FaRegComment />
              <span className="count">{commentCount}</span>
            </button>
            {isModalOpen && (
        <div className="comment-modal">
          <div className="modal-content">
            <button className="close-btn2" onClick={handleCloseModal}>
              <IoMdClose />
            </button>
            <h3>Write a Comment</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Type your comment..."
            />
            <button className="send-btn" onClick={handleSendComment}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
            <button
              className="save-btn"
              onClick={handleSaveToggle}
              //style={{ color: saved ? "blue" : "black" }}
            >
              {saved ? <FaBookmark /> : <FaRegBookmark />}
              <span className="count">{saveCount}</span>
            </button>
            <button className="share-btn" onClick={handleShareClick}>
              <PiShareFatBold />
            </button>
          </div>
          <span className="post-date">{formattedDate}</span>
        </div>
      </div>
      {/* Share Popup */}
      {showSharePopup && (
        <div className="share-popup">
          <p>Share this link:</p>
          <input
            type="text"
            value={shareLink}
            readOnly
            className="share-input"
          />
          <button onClick={copyToClipboard} className="copy-btn">
            Copy Link
          </button>
          <button
            onClick={() => setShowSharePopup(false)}
            className="close-btn"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default SinglePost;
