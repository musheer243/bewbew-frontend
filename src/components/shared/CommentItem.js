import React, { useState } from "react";
import "../../styles/CommentItem.css";
import { API_BASE_URL } from "../../config";
import { ToastContainer, toast } from "react-toastify"; // <-- Make sure you install and import react-toastify

// Helper to format the date array [year, month, day, hour, min, sec, nanos] => "dd/mm/yyyy"
function formatDate(dateArr) {
  if (!Array.isArray(dateArr) || dateArr.length < 3) return "";
  const [year, month, day, hours = 0, minutes = 0, seconds = 0, nanos = 0] = dateArr;
  const ms = Math.floor(nanos / 1_000_000);
  const dateObj = new Date(year, month - 1, day, hours, minutes, seconds, ms);
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const CommentItem = ({ comment, onEdit, onDelete }) => {

  const loggedInUserId = localStorage.getItem("userId");

  const [showOptions, setShowOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [openReplyOptions, setOpenReplyOptions] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({}); // State to track which replies are expanded

  const isLongComment = comment.content.length > 100;
  const formattedDate = formatDate(comment.date);

  // If the backend gave you an array of replies on `comment.replies`
  const [replies, setReplies] = useState(comment.replies || []);

  // Toggle the 3-dot menu for the comment
  const toggleOptions = () => {
    setShowOptions((prev) => !prev);
  };

  // Toggle the reply options menu for a given reply
  const toggleReplyOptions = (replyId) => {
    setOpenReplyOptions((prev) => (prev === replyId ? null : replyId));
  };

  // Toggle expansion for a reply text
  const toggleReplyExpansion = (replyId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  // Start replying
  const handleReplyClick = () => {
    setIsReplying(true);
  };

  // Cancel replying
  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyText("");
  };

  // Submit the new reply
  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    // Check if reply exceeds 255 characters
    if (replyText.length > 255) {
      toast.error("Reply cannot be more than 255 characters");
      return;
    }

    try {
      const token = localStorage.getItem("jwtToken");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) {
        console.error("JWT token or userId is missing");
        return;
      }

      const endpoint = `${API_BASE_URL}/api/comment/${comment.id}/reply?userId=${userId}`;
      const payload = { content: replyText };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Failed to post reply:", response.status, response.statusText);
        return;
      }

      const newReply = await response.json();
      setReplies((prev) => [...prev, newReply]);
      setReplyText("");
      setIsReplying(false);
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  // Delete comment using the DELETE API
  const handleDeleteComment = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(
        `${API_BASE_URL}/api/comment/${comment.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        toast.success("Comment deleted successfully");
        onDelete(comment);
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Error deleting comment");
    }
  };

  // Delete reply using the DELETE API
  const handleDeleteReply = async (replyId) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`${API_BASE_URL}/api/reply/${replyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success("Reply deleted successfully");
        setReplies((prev) => prev.filter((r) => r.id !== replyId));
      } else {
        toast.error("Failed to delete reply");
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Error deleting reply");
    }
  };


  return (
    <div className="CommentItem-container">
      {/* Left: Profile Picture */}
      <img
        src={comment.user.profilepic}
        alt="User Profile"
        className="CommentItem-profile-pic"
      />

      {/* Main content */}
      <div className="CommentItem-content">
        {/* Top Row */}
        <div className="CommentItem-top-row">
          <div className="CommentItem-left-block">
            {/* Username */}
            <span className="CommentItem-username">
              {comment.user.username}
            </span>
            {/* Comment text */}
            <p
              className={`CommentItem-text ${
                !isExpanded && isLongComment ? "CommentItem-text-truncated" : ""
              }`}
            >
              {comment.content}
            </p>
            {/* Container for date and "See more" button */}
            <div className="CommentItem-date-see-more">
              <span className="CommentItem-date">{formattedDate}</span>
              {isLongComment && (
                <button
                  className="CommentItem-see-more"
                  onClick={() => setIsExpanded((prev) => !prev)}
                >
                  {isExpanded ? "See less" : "See more"}
                </button>
              )}
            </div>
          </div>

         {/* Show three-dot options only if the logged-in user owns the comment */}
         {comment.user.id.toString() === loggedInUserId && (
            <div className="CommentItem-right-block">
              <button onClick={toggleOptions} className="CommentItem-options-btn">
                ⋮
              </button>
              {showOptions && (
                <div className="CommentItem-options-menu">
                  <button onClick={() => onEdit(comment)}>Edit</button>
                  <button onClick={handleDeleteComment}>Delete</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Row (Reply on left, View replies in center) */}
        <div className="CommentItem-bottom-row">
          <button className="CommentItem-reply-btn" onClick={handleReplyClick}>
            Reply
          </button>
          {replies.length > 0 && (
            <button
              className="CommentItem-view-replies-btn"
              onClick={() => setShowReplies((prev) => !prev)}
            >
              {showReplies
                ? `Hide replies`
                : `View replies (${replies.length})`}
            </button>
          )}
        </div>

        {/* Replies Section */}
        {showReplies && replies.length > 0 && (
          <div className="CommentItem-replies">
            {replies.map((r) => {
              // Determine if reply is long (threshold set to 100 characters)
              const isLongReply = r.content.length > 100;
              const isReplyExpanded = expandedReplies[r.id] || false;
              return (
                <div key={r.id} className="CommentItem-reply">
                  {/* Reply User Profile Pic */}
                  <img
                    src={r.user.profilepic}
                    alt="Reply User"
                    className="CommentItem-profile-pic reply-pic"
                  />
                  <div className="CommentItem-reply-body">
                    {/* Top Row: Mimics comment structure */}
                    <div className="Reply-top-row">
                      <div className="Reply-left-block">
                        <span className="CommentItem-username">
                          {r.user.username}
                        </span>
                        <p
                          className={`CommentItem-text ${
                            !isReplyExpanded && isLongReply
                              ? "CommentItem-text-truncated"
                              : ""
                          }`}
                        >
                          {r.content}
                        </p>
                        {/* Container for date and "See more" button for reply */}
                        <div className="CommentItem-date-see-more">
                          <span className="CommentItem-date">
                            {formatDate(r.date)}
                          </span>
                          {isLongReply && (
                            <button
                              className="CommentItem-see-more"
                              onClick={() => toggleReplyExpansion(r.id)}
                            >
                              {isReplyExpanded ? "See less" : "See more"}
                            </button>
                          )}
                        </div>
                      </div>

                       {/* Only show reply options if the logged-in user is the owner */}
                       {r.user.id.toString() === loggedInUserId && (
                        <div className="Reply-right-block">
                          <button
                            className="CommentItem-reply-options-btn"
                            onClick={() => toggleReplyOptions(r.id)}
                          >
                            ⋮
                          </button>
                          {openReplyOptions === r.id && (
                            <div className="CommentItem-reply-options-menu">
                              {/* Uncomment the edit option if needed */}
                              <button onClick={() => onEdit(r)}>Edit</button>
                              <button onClick={() => handleDeleteReply(r.id)}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Reply Button */}
                    <div className="Reply-bottom-row">
                      <button className="CommentItem-reply-btn">Reply</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply Input Section */}
        {isReplying && (
          <>
            <div className="CommentItem-replying-to">
              <span>Replying to {comment.user.username}</span>
              <button
                className="CommentItem-cancel-reply-btn"
                onClick={handleCancelReply}
              >
                ×
              </button>
            </div>
            <div className="CommentItem-reply-input">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Write a reply to ${comment.user.username}...`}
              />
              <button
                onClick={handleSendReply}
                className="CommentItem-send-reply-btn"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default CommentItem;
