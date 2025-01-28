import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import SinglePost from "./SinglePost";
import "../../styles/SharedPostViewer.css";

const SharedPostViewer = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
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
    return <div>{error}</div>;
  }

  return (
    <div className="my-post">
      {post ? <SinglePost post={post} /> : <div>Loading...</div>}
    </div>
  );
};

export default SharedPostViewer;
