import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SinglePost from "../shared/SinglePost";
import "../../styles/MyLikedPosts.css"; 
import { API_BASE_URL } from "../../config";


const MyLikedPosts = () => {
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("jwtToken");

        if (!userId || !token) {
          console.error("User ID or JWT token is missing");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/post/user/${userId}/liked-posts`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              pageNumber: pageNumber,
              pageSize: 10,
              sortBy: "id",
              sortDir: "desc",
            },
          }
        );

        const data = response.data;
        // Deduplicate posts: filter out any new posts that are already in likedPosts
        setLikedPosts((prevPosts) => {
          const newUniquePosts = data.content.filter(
            (newPost) =>
              !prevPosts.some((post) => post.postId === newPost.postId)
          );
          return [...prevPosts, ...newUniquePosts];
        });
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error fetching liked posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, [pageNumber]);

  // Infinite scrolling: When the user nears the bottom, load the next page
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1 >=
          document.documentElement.offsetHeight &&
        !loading &&
        pageNumber < totalPages - 1
      ) {
        setPageNumber((prevPageNumber) => prevPageNumber + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, pageNumber, totalPages]);

  // Show initial loading only when no posts have been loaded yet
  if (loading && likedPosts.length === 0) {
    return <div>Loading liked posts...</div>;
  }

  return (
    <div className="post-activity-container">
      <h2>My Liked Posts</h2>
      {likedPosts.length > 0 ? (
        <div className="post-grid">
          {likedPosts.map((post) => (
            <SinglePost key={post.postId} post={post} />
          ))}
        </div>
      ) : (
        <p>You haven't liked any posts yet.</p>
      )}
     
    </div>
  );
};

export default MyLikedPosts;
