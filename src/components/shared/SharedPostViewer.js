import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import SinglePost from "./SinglePost";
import "../../styles/SharedPostViewer.css";

function SharedPostViewer() {
  const { postId } = useParams();
  const location = useLocation(); 
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  
  // We'll store any "highlighted" IDs here:
  const [highlightCommentId, setHighlightCommentId] = useState(null);
  const [highlightReplyId, setHighlightReplyId] = useState(null);

  useEffect(() => {
    // 1) If there's a hash like "#comment-456-reply-789", parse it:
    if (location.hash) {
      // e.g. "#comment-456" or "#comment-456-reply-789"
      const hash = location.hash; // "#comment-456-reply-789"

      // A simple regex that captures commentId and optional replyId
      // Explanation:
      //   ^#comment-(\d+): means we start with "#comment-", then capture 1..n digits as group1
      //   (?:-reply-(\d+))?: means optionally match "-reply-" + digits => group2
      // The "?" after the group means it's optional.
      const match = hash.match(/^#comment-(\d+)(?:-reply-(\d+))?$/);
      if (match) {
        const cId = match[1]; // e.g. "456"
        const rId = match[2]; // e.g. "789" (or undefined if no reply)
        if (cId) setHighlightCommentId(parseInt(cId, 10));
        if (rId) setHighlightReplyId(parseInt(rId, 10));
      }
    }
  }, [location.hash]);

  useEffect(() => {
    // 2) Fetch the post from your API
    const fetchPost = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/post/view/${postId}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data);
        } else {
          setError("Post not found or no longer available.");
        }
      } catch (err) {
        setError("An error occurred while fetching the post.");
      }
    };
    fetchPost();
  }, [postId]);

  if (error) {
    return <div className="my-post"><div>{error}</div></div>;
  }

  return (
    <div className="my-post">
      {post ? (
        <SinglePost
          post={post}
          highlightCommentId={highlightCommentId}
          highlightReplyId={highlightReplyId}
        />
      ) : (
        <div className="loading-container">Loading...</div>
      )}
    </div>
  );
}

export default SharedPostViewer;
