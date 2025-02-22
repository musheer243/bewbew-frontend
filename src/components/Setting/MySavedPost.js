import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SinglePost from "../shared/SinglePost";
import { API_BASE_URL } from "../../config";
import "../../styles/MyLikedPosts.css";
import { FaArrowLeft } from "react-icons/fa";

const MySavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
      const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("jwtToken");
        if (!userId || !token) {
          console.error("User ID or JWT token is missing");
          return;
        }

        // Use separate loading states for initial load and subsequent pages
        if (pageNumber === 0) {
          setInitialLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/post/user/${userId}/saved-posts`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              pageNumber: pageNumber,
              pageSize: 10,
              sortBy: "id", // or a field like "savedAt" if available
              sortDir: "desc", // descending: most recent saved posts first
            },
          }
        );

        const data = response.data;
        setSavedPosts((prevPosts) => {
          // If we're on page 0 and already have posts, do not update to avoid resetting the state
          if (pageNumber === 0 && prevPosts.length > 0) {
            return prevPosts;
          }
          const newUniquePosts = data.content.filter(
            (newPost) =>
              !prevPosts.some((post) => post.postId === newPost.postId)
          );
          return pageNumber === 0 ? newUniquePosts : [...prevPosts, ...newUniquePosts];
        });
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error fetching saved posts:", error);
      } finally {
        if (pageNumber === 0) {
          setInitialLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    };

    fetchSavedPosts();
  }, [pageNumber]);

  // Infinite scrolling: load the next page when user nears the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1 >=
          document.documentElement.offsetHeight &&
        !loadingMore &&
        pageNumber < totalPages - 1
      ) {
        setPageNumber((prevPageNumber) => prevPageNumber + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, pageNumber, totalPages]);

  if (initialLoading && savedPosts.length === 0) {
    return <div>Loading saved posts...</div>;
  }

  return (
    
    <div className="post-activity-container">
<div>
      <h3>My Saved Posts</h3>
</div>
      <div className="back-button" onClick={() => navigate("/setting")}>
                <FaArrowLeft className="back-icon" />
              </div>
      <div className="post-grid">
        {savedPosts.map((post) => (
          <SinglePost key={post.postId} post={post} />
        ))}
      </div>
      {loadingMore && <div>Loading more...</div>}
    </div>
  );
};

export default MySavedPosts;
