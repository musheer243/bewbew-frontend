import React, { useState } from "react";
import "../../styles/CommentItem.css";
import { API_BASE_URL } from "../../config";
import { ToastContainer, toast } from "react-toastify"; // Ensure react-toastify is installed

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

// Add this helper function near the top of your CommentItem component
const parseMentions = (text) => {
  // Split text at occurrences of @ followed by one or more word characters
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, index) =>
    part.startsWith("@") ? (
      <a key={index} href="#" className="mention">
        {part}
      </a>
    ) : (
      part
    )
  );
};


const CommentItem = ({ comment, onEdit, onDelete }) => {
  const loggedInUserId = localStorage.getItem("userId");

  // ***** Comment Update States *****
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentEditText, setCommentEditText] = useState(comment.content);

  // ***** Reply Update States *****
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState("");

  // New state: replyingTo - which username we're replying to
  const [replyingTo, setReplyingTo] = useState(null);

  const [showOptions, setShowOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [openReplyOptions, setOpenReplyOptions] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({}); // For toggling "See more" in replies

  const isLongComment = comment.content.length > 100;
  const formattedDate = formatDate(comment.date);

  // Local replies state (from backend)
  const [replies, setReplies] = useState(comment.replies || []);

  // ----- Toggle functions -----
  const toggleOptions = () => setShowOptions((prev) => !prev);
  const toggleReplyOptions = (replyId) =>
    setOpenReplyOptions((prev) => (prev === replyId ? null : replyId));
  const toggleReplyExpansion = (replyId) => {
    setExpandedReplies((prev) => ({ ...prev, [replyId]: !prev[replyId] }));
  };

  // ----- Reply Actions -----
  // For replying to a comment, set replyingTo as the comment owner's username.
  const handleReplyClick = () => {
    setReplyingTo(comment.user.username);
    setIsReplying(true);
  };

  // For replying to a reply, set replyingTo to that reply's username.
  const handleReplyToReply = (username) => {
    setReplyingTo(username);
    setIsReplying(true);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyText("");
    setReplyingTo(null);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
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
      // Using the same endpoint for both comment replies and reply replies.
      const endpoint = `${API_BASE_URL}/api/comment/${comment.id}/reply?userId=${userId}`;
      
      // Prepend the reply text with the mention if replyingTo is set.
      const finalPayload = replyingTo
        ? { content: `@${replyingTo} ${replyText}` }
        : { content: replyText };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) {
        console.error("Failed to post reply:", response.status, response.statusText);
        return;
      }

      const newReply = await response.json();
      setReplies((prev) => [...prev, newReply]);
      setReplyText("");
      setIsReplying(false);
      setReplyingTo(null);
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  // ----- Delete Comment -----
  const handleDeleteComment = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`${API_BASE_URL}/api/comment/${comment.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        onDelete(comment); // Inform parent to remove this comment from the UI
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Error deleting comment");
    }
  };

  // ----- Update Comment -----
  const handleStartEditComment = () => {
    setIsEditingComment(true);
    setCommentEditText(comment.content);
    setShowOptions(false);
  };

  const handleCancelEditComment = () => {
    setIsEditingComment(false);
    setCommentEditText(comment.content);
  };

  const handleSaveEditComment = async () => {
    if (!commentEditText.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }
    if (commentEditText.length > 255) {
      toast.error("Comment cannot be more than 255 characters");
      return;
    }
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("JWT token is missing");
        return;
      }
      const endpoint = `${API_BASE_URL}/api/comment/update/${comment.id}`;
      const payload = { ...comment, content: commentEditText };

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error("Failed to update comment");
        return;
      }

      const updatedComment = await response.json();
      setIsEditingComment(false);
      onEdit(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Error updating comment");
    }
  };

  // ----- Delete Reply -----
  const handleDeleteReply = async (replyId) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`${API_BASE_URL}/api/reply/${replyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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

  // ----- Update Reply -----
  const handleStartEditReply = (r) => {
    setEditingReplyId(r.id);
    setEditingReplyText(r.content);
    setOpenReplyOptions(null);
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyText("");
  };

  const handleSaveEditReply = async () => {
    if (!editingReplyText.trim()) {
      toast.error("Reply cannot be empty.");
      return;
    }
    if (editingReplyText.length > 255) {
      toast.error("Reply cannot be more than 255 characters");
      return;
    }
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("JWT token is missing");
        return;
      }
      const endpoint = `${API_BASE_URL}/api/update/${editingReplyId}`;
      const payload = { content: editingReplyText };

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error("Failed to update reply");
        return;
      }

      const updatedReply = await response.json();
      toast.success("Reply updated successfully");
      setReplies((prevReplies) =>
        prevReplies.map((r) => (r.id === updatedReply.id ? updatedReply : r))
      );
      setEditingReplyId(null);
      setEditingReplyText("");
    } catch (error) {
      console.error("Error updating reply:", error);
      toast.error("Error updating reply");
    }
  };

  return (
    <div className="CommentItem-container">
      {/* Profile Picture */}
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
            <span className="CommentItem-username">{comment.user.username}</span>
            {/* Comment Text or Edit Field */}
            {isEditingComment ? (
              <div className="CommentItem-edit-container">
                <textarea
                  value={commentEditText}
                  onChange={(e) => setCommentEditText(e.target.value)}
                />
                <div className="CommentItem-edit-buttons">
                  <button onClick={handleSaveEditComment}>Save</button>
                  <button onClick={handleCancelEditComment}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
          {/* Options Menu (only if the logged-in user owns the comment) */}
          {comment.user.id.toString() === loggedInUserId && (
            <div className="CommentItem-right-block">
              <button onClick={toggleOptions} className="CommentItem-options-btn">
                ⋮
              </button>
              {showOptions && (
                <div className="CommentItem-options-menu">
                  <button onClick={handleStartEditComment}>Edit</button>
                  <button onClick={handleDeleteComment}>Delete</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Row: Reply and View Replies */}
        <div className="CommentItem-bottom-row">
          <button
            className="CommentItem-reply-btn"
            onClick={handleReplyClick}
          >
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
              const isLongReply = r.content.length > 100;
              const isReplyExpanded = expandedReplies[r.id] || false;
              const isEditingThisReply = editingReplyId === r.id;
              return (
                <div key={r.id} className="CommentItem-reply">
                  {/* Reply Profile Picture */}
                  <img
                    src={r.user.profilepic}
                    alt="Reply User"
                    className="CommentItem-profile-pic reply-pic"
                  />
                  <div className="CommentItem-reply-body">
                    <div className="Reply-top-row">
                      <div className="Reply-left-block">
                        <span className="CommentItem-username">{r.user.username}</span>
                        {/* If editing this reply, show edit input */}
                        {isEditingThisReply ? (
                          <div className="Reply-edit-container">
                            <textarea
                              value={editingReplyText}
                              onChange={(e) => setEditingReplyText(e.target.value)}
                            />
                            <div className="Reply-edit-buttons">
                              <button onClick={handleSaveEditReply}>Save</button>
                              <button onClick={handleCancelEditReply}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p
                              className={`CommentItem-text ${
                                !isReplyExpanded && isLongReply
                                  ? "CommentItem-text-truncated"
                                  : ""
                              }`}
                            >
                              {parseMentions(r.content)}
                            </p>
                            <div className="CommentItem-date-see-more">
                              <span className="CommentItem-date">{formatDate(r.date)}</span>
                              {isLongReply && (
                                <button
                                  className="CommentItem-see-more"
                                  onClick={() => toggleReplyExpansion(r.id)}
                                >
                                  {isReplyExpanded ? "See less" : "See more"}
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {/* Reply Options (if the reply belongs to the logged-in user) */}
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
                              <button onClick={() => handleStartEditReply(r)}>Edit</button>
                              <button onClick={() => handleDeleteReply(r.id)}>Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="Reply-bottom-row">
                      {/* When replying to a reply, set replyingTo to that reply's username */}
                      <button
                        className="CommentItem-reply-btn"
                        onClick={() => {
                          setReplyingTo(r.user.username);
                          setIsReplying(true);
                        }}
                      >
                        Reply
                      </button>
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
              <span>
                Replying to{" "}
                <a href="#" className="mention">
                  @{replyingTo || comment.user.username}
                </a>
              </span>
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
                placeholder="Write your reply..."
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
      {/* Remove ToastContainer from here if it's already added at your app's root */}
      <ToastContainer />
    </div>
  );
};

export default CommentItem;
