import React from "react";
import "../../styles/SinglePost.css";

const SinglePost = ({ post }) => {
  const { title, mediaFileNames = [], content, addedDate } = post;

  // Format `addedDate` (from array to readable string)
  const formattedDate = addedDate
    ? new Date(...addedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown Date";

  return (
    <div className="single-post">
      <h2 className="post-title">{title}</h2>

      <div className="post-media">
        {Array.isArray(mediaFileNames) && mediaFileNames.length > 0 ? (
          mediaFileNames.map((file, index) =>
            file.endsWith(".mp4") ? (
              <video key={index} controls>
                <source src={file} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img key={index} src={file} alt={`Media ${index + 1}`} />
            )
          )
        ) : (
          <p>No media available.</p>
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
