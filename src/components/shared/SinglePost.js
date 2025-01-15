import React, { useState } from "react";
import "../../styles/SinglePost.css";

const SinglePost = ({ post }) => {
  const { title, mediaFileNames = [], content, addedDate } = post;
  const [currentIndex, setCurrentIndex] = useState(0); // Track the current image index

  // Format `addedDate` (from array to readable string)
  const formattedDate = addedDate
    ? new Date(...addedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
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
      <h2 className="post-title">{title}</h2>

      <div className="post-media">
        {mediaFileNames.length > 0 && (
          <div className="media-container">
            <img src={mediaFileNames[currentIndex]} alt={`Media ${currentIndex + 1}`} className="main-image" />
            {mediaFileNames.length > 1 && (
              <>
                <button className="prev-btn" onClick={prevImage}>←</button>
                <button className="next-btn" onClick={nextImage}>→</button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="post-content">{content}</p>

      <div className="post-footer">
        <div className="post-buttons">
          <button className="like-btn">Like</button>
          <button className="comment-btn">Comment</button>
          <button className="share-btn">Share</button>
          <button className="save-btn">Save</button>
        </div>
        <span className="post-date">{formattedDate}</span>
      </div>
    </div>
  );
};

export default SinglePost;
