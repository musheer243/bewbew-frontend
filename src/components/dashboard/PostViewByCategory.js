import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import SinglePost from "../shared/SinglePost"; // Adjust path if needed
import { API_BASE_URL } from "../../config";
import "../../styles/PostViewByCategory.css";
import { FaArrowLeft } from "react-icons/fa";

function PostViewByCategory() {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // If you passed categoryTitle via state when navigating from search
  const initialTitle = location.state?.categoryTitle || "Category";
  const [categoryTitle] = useState(initialTitle);

  const [posts, setPosts] = useState([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const token = localStorage.getItem("jwtToken");

  // 1) A function to fetch a page of posts for the given category
  const fetchPosts = useCallback(
    async (page) => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/category/${categoryId}/posts?pageNumber=${page}&pageSize=5&sortBy=postId&sortDir=desc`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          // data => { content, pageNumber, totalPages, lastPage, ... }

          // Filter out duplicates by postId before appending
          setPosts((prev) => {
            const newItems = [];
            for (const item of data.content) {
              if (!prev.some((old) => old.postId === item.postId)) {
                newItems.push(item);
              }
            }
            return [...prev, ...newItems];
          });

          // If we've reached the last page, or the backend says `lastPage=true`, stop
          if (data.lastPage || page >= data.totalPages - 1) {
            setHasMore(false);
          }
        } else {
          console.error("Failed to fetch posts by category");
        }
      } catch (error) {
        console.error("Error fetching category posts:", error);
      }
      setLoading(false);
    },
    [categoryId, token]
  );

  // 2) On mount or when pageNumber changes, load more posts
  useEffect(() => {
    fetchPosts(pageNumber);
  }, [pageNumber, fetchPosts]);

  // 3) Implement **window-based** infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const scrollTop = window.scrollY; // how far the user has scrolled from the top
      const clientHeight = window.innerHeight; // viewport height
      const scrollHeight = document.documentElement.scrollHeight; // total doc height

      // If near the bottom, load the next page
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setPageNumber((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  return (
    <div className="postViewCategoryContainer">
      {/* Header with back button */}
      <div className="postViewCategoryHeader">
        <button className="postViewCategoryBackButton" onClick={() => navigate(-1)}>
          <FaArrowLeft style={{ marginRight: "6px" }} />
          {/* Back */}
        </button>
        <h2 className="postViewCategoryTitle">
          Posts under &ldquo;{categoryTitle}&rdquo; category
        </h2>
      </div>

      {/* Main content (posts) */}
      <div className="postViewCategoryContent">
        {/* If we have zero posts and not loading, show a message */}
        {posts.length === 0 && !loading && (
          <p className="postViewCategoryNoPostsMessage">
            No post created with this category.
          </p>
        )}

       {/* Render each post with an ad after every 4 posts */}
      {posts.map((post, index) => (
        <React.Fragment key={post.postId}>
          <SinglePost post={post} />
          {(index + 1) % 4 === 0 && <AdSenseComponent />}
        </React.Fragment>
      ))}

        {/* Loading indicator at the bottom */}
        {loading && <div className="postViewCategoryLoadingIndicator">Loading...</div>}
      </div>
    </div>
  );
}

export default PostViewByCategory;
