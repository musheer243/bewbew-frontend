import React, { useState } from "react";
import "../../styles/CommentItem.css";
import { API_BASE_URL } from "../../config";


const CommentItem = ({ comment, onEdit, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // For showing/hiding replies
  const [showReplies, setShowReplies] = useState(false);

  // For replying to a particular comment
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  
  // Safely parse the date array and format as dd/mm/yyyy
  const formatDate = (dateArr) => {
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
  };

  const formattedDate = formatDate(comment.date);

  // If comment is quite long, we can show a "see more" toggle
  const isLongComment = comment.content.length > 100;

  // Example: an array of replies for demonstration (replace with real data or props)
  // Each reply has the same structure: { id, user, content, date, etc. }
  const [replies, setReplies] = useState(comment.replies || []);

  const toggleOptions = () => {
    setShowOptions((prev) => !prev);
  };

  const handleReplyClick = () => {
    setIsReplying(true);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyText("");
  };

  // When user presses "Send" in the reply input
const handleSendReply = async () => {
  if (!replyText.trim()) return;

  try {
    // 1) Retrieve necessary auth info
    const token = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      console.error("JWT token or userId is missing");
      return;
    }

    // 2) Construct the API endpoint, using comment.id
    //    If your comment object has a different field (e.g., comment.commentId), adjust accordingly
    const endpoint = `${API_BASE_URL}/api/comment/${comment.id}/reply?userId=${userId}`;

    // 3) Create the payload object
    const payload = { content: replyText };

    // 4) Send the POST request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // 5) Check if it succeeded
    if (!response.ok) {
      console.error("Failed to post reply:", response.status, response.statusText);
      return;
    }

    // 6) Parse the newly created reply (ReplyDto)
    const newReply = await response.json();

    // 7) Update local state to show this new reply
    setReplies((prev) => [...prev, newReply]);

    // 8) Clear the input and exit “replying” mode
    setReplyText("");
    setIsReplying(false);

  } catch (error) {
    console.error("Error posting reply:", error);
  }
};


  return (
    <div className="CommentItem-container">
      {/* Profile picture */}
      <img
        src={comment.user.profilepic}
        alt="User Profile"
        className="CommentItem-profile-pic"
      />

      <div className="CommentItem-body">
        {/* Top row: username (left) & date (right) */}
        <div className="CommentItem-top-row">
          <span className="CommentItem-username">{comment.user.username}</span>
          <span className="CommentItem-date">{formattedDate}</span>
        </div>

        {/* Main comment text (with optional "see more") */}
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

        {/* "Reply" button */}
        <button className="CommentItem-reply-btn" onClick={handleReplyClick}>
          Reply
        </button>

        {/* If there are replies, show "View replies" */}
        {replies.length > 0 && (
          <button
            className="CommentItem-view-replies-btn"
            onClick={() => setShowReplies((prev) => !prev)}
          >
            {showReplies ? "Hide replies" : `View replies (${replies.length})`}
          </button>
        )}

        {/* If showReplies, display the replies below */}
        {showReplies && replies.length > 0 && (
          <div className="CommentItem-replies">
            {replies.map((r) => (
              <div key={r.id} className="CommentItem-reply">
                <img
                  src={r.user.profilepic}
                  alt="Reply User"
                  className="CommentItem-profile-pic reply-pic"
                />
                <div className="CommentItem-reply-body">
                  <div className="CommentItem-top-row">
                    <span className="CommentItem-username">{r.user.username}</span>
                    <span className="CommentItem-date">{formatDate(r.date)}</span>
                  </div>
                  <p className="CommentItem-text">{r.content}</p>
                  {/* You can add nested reply, 3-dot menu, etc. */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* If isReplying, show a "Replying to X" label + close (X) */}
        {isReplying && (
          <div className="CommentItem-replying-to">
            <span>Replying to {comment.user.username}</span>
            <button className="CommentItem-cancel-reply-btn" onClick={handleCancelReply}>
              ×
            </button>
          </div>
        )}

        {/* If isReplying, show an input for the new reply */}
        {isReplying && (
          <div className="CommentItem-reply-input">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Write a reply to ${comment.user.username}...`}
            />
            <button onClick={handleSendReply} className="CommentItem-send-reply-btn">
              Send
            </button>
          </div>
        )}
      </div>

      {/* Options (3-dot) on the right */}
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
