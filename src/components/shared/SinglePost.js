import React, { useState } from "react";
import "../../styles/SinglePost.css";
import { FaHeart } from "react-icons/fa";
import { FaRegComment } from "react-icons/fa";
import { PiShareFatBold } from "react-icons/pi";
import { FaBookmark } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa";



const SinglePost = ({ post }) => {
  const { title, mediaFileNames = [], content, addedDate, user } = post;
  const { username, profilepic } = user || {};
  const [currentIndex, setCurrentIndex] = useState(0); // Track the current image index
  const [liked, setLiked] = useState(false); // Track if post is liked
  const [saved, setSaved] = useState(false); // Track if post is saved

  // Format `addedDate` (from array to readable string)
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

  return (
    <div className="single-post">
      {/* Post Header */}
      <div className="post-header">
        <div className="user-info">
          <img src={profilepic} alt="Profile" className="profile-pic" />
          <span className="username">{username}</span>
        </div>
        <button className="menu-btn">
        <BsThreeDotsVertical />
        </button>
      </div>

      <h2 className="post-title">{title}</h2>

      <div className="post-media">
        {mediaFileNames.length > 0 && (
          <div className="media-container">
            <img
              src={mediaFileNames[currentIndex]}
              alt={`Media ${currentIndex + 1}`}
              className="main-image"
            />
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
            {liked ? <FaHeart /> : <FaRegHeart />
            }
          </button>
          <button className="comment-btn">
            <FaRegComment />
          </button>
          <button className="share-btn">
            <PiShareFatBold />
          </button>
          <button
            className="save-btn"
            onClick={() => setSaved(!saved)}
          >
            {saved ? <FaBookmark /> : <FaRegBookmark />}
          </button>
        </div>
        <span className="post-date">{formattedDate}</span>
      </div>
    </div>
  );
};

export default SinglePost;
