import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import SinglePost from "../shared/SinglePost"; // Import the SinglePost component
import "../../styles/MyPosts.css";

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(0); // Track current page
  const [totalPages, setTotalPages] = useState(1); // Track total pages

  const postsContainerRef = useRef(null); // Ref to the posts container

  // Handle scroll and load next page
  const handleScroll = useCallback((e) => {
    const bottom =
      e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
    if (bottom && !loading && pageNumber < totalPages - 1) {
      setPageNumber((prevPageNumber) => prevPageNumber + 1); // Load next page
    }
  }, [loading, pageNumber, totalPages]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("jwtToken");

        if (!userId || !token) {
          setError("User ID or token is missing.");
          return;
        }

        setLoading(true); // Set loading to true before the API call

        const response = await axios.get(
          `http://34.227.206.93:9090/api/user/${userId}/posts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              pageNumber: pageNumber, // Use the current page number
              pageSize: 10,
              sortBy: "addedDate",
              sortDir: "desc",
            },
          }
        );

        if (response.status === 200) {
            const newPosts = response.data.content || [];
            setPosts((prevPosts) => [
              ...prevPosts.filter((post) => !newPosts.some((newPost) => newPost.postId === post.postId)),
              ...newPosts
            ]);
            setTotalPages(response.data.totalPages); // Set total pages from API response
          } else {
            setError("Failed to fetch posts.");
          }
        } catch (err) {
          console.error("Error fetching posts:", err);
          setError("An error occurred while fetching posts.");
        } finally {
          setLoading(false); // Set loading to false after the API call
        }
      };

    fetchUserPosts();
  }, [pageNumber]); // Trigger effect when the page number changes

  // Detect when the user reaches the bottom of the page
  useEffect(() => {
    const postContainer = postsContainerRef.current;
    if (postContainer) {
      postContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (postContainer) {
        postContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]); // Include handleScroll in the dependency array

  if (loading && pageNumber === 0) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="my-posts" ref={postsContainerRef}>
      <h1>My Posts</h1>
      {posts.length === 0 ? (
        <div className="no-posts">You have not created any posts yet.</div>
      ) : (
        posts.map((post) => <SinglePost key={post.postId} post={post} />)
      )}
      {loading && <div className="loading-indicator">Loading more posts...</div>}
    </div>
  );
};

export default MyPosts;
