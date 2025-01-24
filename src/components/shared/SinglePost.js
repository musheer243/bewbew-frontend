import React, { useState, useEffect } from "react";
import "../../styles/SinglePost.css";
import {
  FaHeart,
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

const SinglePost = ({ post, onDelete, onEdit, darkModeFromDashboard }) => {
  const { title, mediaFileNames = [], content, addedDate, user, likeCount,
    saveCount,
    commentCount, } = post;
  const { username, profilepic } = user || {};
  const [currentIndex, setCurrentIndex] = useState(0); // Track the current image index
  const [liked, setLiked] = useState(false); // Track if post is liked
  const [saved, setSaved] = useState(false); // Track if post is saved
  const [showOptions, setShowOptions] = useState(false); // State for dropdown

  useEffect(() => {
    document.title = "BewBew • My Posts";
  }, []);

  useEffect(() => {
    // Update the document body class whenever darkModeFromDashboard changes
    document.body.classList.toggle("dark-mode", darkModeFromDashboard);
  }, [darkModeFromDashboard]);
  
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
                <img
                  src={mediaFileNames[currentIndex]}
                  alt={`Media ${currentIndex + 1}`}
                  className="main-image"
                />
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
              onClick={() => setLiked(!liked)}
              style={{ color: liked ? "red" : "black" }}
            >
              {liked ? <FaHeart /> : <FaRegHeart />}
              <span className="count">{likeCount}</span>
            </button>
            <button className="comment-btn">
              <FaRegComment />
              <span className="count">{commentCount}</span>
            </button>
            <button className="save-btn" onClick={() => setSaved(!saved)}>
              {saved ? <FaBookmark /> : <FaRegBookmark />}
              <span className="count">{saveCount}</span>
            </button>
            <button className="share-btn">
              <PiShareFatBold />
            </button>
          </div>
          <span className="post-date">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default SinglePost;
