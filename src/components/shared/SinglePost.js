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
import { IoClose } from "react-icons/io5";


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
  const [comments, setComments] = useState([]); // <-- Add this line
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

  // const handleSendComment = () => {
  //   if (comment.trim()) {
  //     console.log("Comment:", comment);
  //     setComment(""); // Clear input after sending
  //   }
  // };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setComment(""); // Clear the input when closing
  };

  const handleCommentClick = () => {
    setIsModalOpen(true);
    console.log("Modal Open:", isModalOpen);
  };

  const handleSendComment = () => {
    if (comment.trim()) {
      setComments([...comments, comment]); // Add new comment to the list
      setComment(""); // Clear input field
    }
  };

  return (
    <div className="SinglePost-single-post-container">
      <div className="SinglePost-single-post">
        {/* Post Header */}
        <div className="SinglePost-post-header">
          <div className="SinglePost-user-info">
            <img src={profilepic} alt="Profile" className="SinglePost-profile-pic" />
            <span className="SinglePost-username">{username}</span>
          </div>
          <div className="SinglePost-menu-container">
            <button className="SinglePost-menu-btn" onClick={toggleOptions}>
              <BsThreeDotsVertical />
            </button>
            <div className={`SinglePost-dropdown-menu ${showOptions ? "SinglePost-show" : ""}`}>
              <button className="SinglePost-dropdown-item">
                <MdEdit style={{ marginRight: "8px" }} />
                Edit
              </button>
              <button className="SinglePost-dropdown-item">
                <IoIosShareAlt style={{ marginRight: "8px" }} />
                Share
              </button>
              <button className="SinglePost-dropdown-item">
                <HiTranslate style={{ marginRight: "8px" }} />
                Translate
              </button>
              <button className="SinglePost-dropdown-item">
                <MdDelete style={{ marginRight: "8px" }} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="SinglePost-post-header-divider"></div>

        <h2 className="SinglePost-post-title" style={{ fontSize: "20px" }}>
          {title}
        </h2>

        <div className="SinglePost-post-media">
          {mediaFileNames.length > 0 && (
            <div className="SinglePost-media-container">
              <div className="SinglePost-aspect-ratio-box">
                {mediaFileNames[currentIndex].endsWith(".mp4") ? (
                  <video
                    controls
                    src={mediaFileNames[currentIndex]}
                    className="SinglePost-media-video"
                  />
                ) : (
                  <img
                    src={mediaFileNames[currentIndex]}
                    alt={`Media ${currentIndex + 1}`}
                    className="SinglePost-main-image"
                  />
                )}
              </div>
              {mediaFileNames.length > 1 && (
                <>
                  <button className="SinglePost-prev-btn" onClick={prevImage}>
                    ←
                  </button>
                  <button className="SinglePost-next-btn" onClick={nextImage}>
                    →
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <p className="SinglePost-post-content">{content}</p>

        <div className="SinglePost-post-footer">
          <div className="SinglePost-post-buttons">
            <button className="SinglePost-like-btn" onClick={handleLikeToggle}>
              {liked ? <FcLike /> : <FaRegHeart />}
              <span className="SinglePost-count">{likeCount}</span>
            </button>
            <button className="SinglePost-comment-btn" onClick={handleCommentClick}>
              <FaRegComment />
              <span className="SinglePost-count">{commentCount}</span>
            </button>
            {isModalOpen && (
              <div className="SinglePost-comment-modal">
                <div className="SinglePost-modal-header">
                  <h3>Comments</h3>
                  <button className="SinglePost-close-btn2" onClick={handleCloseModal}>
                    <IoMdClose />
                  </button>
                </div>
                <div className="SinglePost-comment-list">
                  {comments && comments.length > 0 ? (
                    comments.map((c, index) => (
                      <div key={index} className="SinglePost-comment-item">
                        {c}
                      </div>
                    ))
                  ) : (
                    <p className="SinglePost-no-comments">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
                <div className="SinglePost-comment-input">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                  />
                  <button className="SinglePost-send-btn" onClick={handleSendComment}>
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            )}
            <button className="SinglePost-save-btn" onClick={handleSaveToggle}>
              {saved ? <FaBookmark /> : <FaRegBookmark />}
              <span className="SinglePost-count">{saveCount}</span>
            </button>
            <button className="SinglePost-share-btn" onClick={handleShareClick}>
              <PiShareFatBold />
            </button>
          </div>
          <span className="SinglePost-post-date">{formattedDate}</span>
        </div>
      </div>
      {showSharePopup && (
        <div className="SinglePost-share-popup">
          <button
            onClick={() => setShowSharePopup(false)}
            className="SinglePost-close-btn"
          >
            <IoClose size={20} />
          </button>
          <p>Share this link:</p>
          <input
            type="text"
            value={shareLink}
            readOnly
            className="SinglePost-share-input"
          />
          <button onClick={copyToClipboard} className="SinglePost-copy-btn">
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
};

export default SinglePost;
