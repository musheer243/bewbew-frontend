import React, { useState } from "react";
import "../../styles/CommentItem.css"; // Import the CSS for this component

const CommentItem = ({ comment, onEdit, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleOptions = () => {
    setShowOptions((prev) => !prev);
  };

  // Safely parse the date array and format as dd/mm/yyyy
  const formatDate = (dateArr) => {
    // If it's not an array or has fewer than 3 elements (year, month, day), return empty
    if (!Array.isArray(dateArr) || dateArr.length < 3) {
      return "";
    }

    // Destructure with defaults in case hour/minute/second/nanos are missing
    const [year, month, day, hours = 0, minutes = 0, seconds = 0, nanos = 0] = dateArr;

    // Convert nanoseconds to milliseconds
    const ms = Math.floor(nanos / 1_000_000);

    // Create the Date object. Note that month in JS is 0-based (0 = January)
    const dateObj = new Date(year, month - 1, day, hours, minutes, seconds, ms);

    // If it's invalid, bail out
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    // Format as dd/mm/yyyy (en-GB)
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // comment.date is now an array like [2025, 2, 16, 20, 10, 56, 975026000]
  const formattedDate = formatDate(comment.date);

  // Determine if the comment is long (adjust the threshold as needed)
  const isLongComment = comment.content.length > 100;

  return (
    <div className="CommentItem-container">
      {/* Left: User's profile picture */}
      <img
        src={comment.user.profilepic}
        alt="User Profile"
        className="CommentItem-profile-pic"
      />

      {/* Middle: Comment text and date */}
      <div className="CommentItem-body">
        <p
          className={`CommentItem-text ${
            !isExpanded && isLongComment ? "CommentItem-text-truncated" : ""
          }`}
        >
          {comment.content}
        </p>
        {isLongComment && (
          <button
            className="CommentItem-see-more"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? "See less" : "See more"}
          </button>
        )}
        <span className="CommentItem-date">{formattedDate}</span>
      </div>

      {/* Right: Options button */}
      <div className="CommentItem-options">
        <button onClick={toggleOptions} className="CommentItem-options-btn">
          ⋮
        </button>
        {showOptions && (
          <div className="CommentItem-options-menu">
            <button onClick={() => onEdit(comment)}>Edit</button>
            <button onClick={() => onDelete(comment)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
