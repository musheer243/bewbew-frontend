import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom"; // Import useLocation
import axios from "axios";
import SinglePost from "../shared/SinglePost"; // Import the SinglePost component
import "../../styles/MyPosts.css";
import { API_BASE_URL } from "../../config";
import AdSenseComponent from "../../AdSenseComponent";
const MyPosts = () => {



  const { userId: paramsUserId  } = useParams(); // Get userId from URL if available
  const location = useLocation(); // Access location to retrieve state
  const stateUserId = location.state?.userId; // Extract from navigation state
 
  const darkMode = location.state?.darkMode || false; // Default to light mode if not provided

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(0); // Track current page
  const [totalPages, setTotalPages] = useState(1); // Track total pages

  const postsContainerRef = useRef(null); // Ref to the posts container

  const viewedUserId = stateUserId || location.state?.userId; // Get the userId from navigation state
  const loggedInUserId = localStorage.getItem("userId");

  console.log("Params userId:", undefined);
  console.log("Location state userId:", stateUserId);
  console.log("Final viewedUserId:", viewedUserId);
  console.log("Logged-in userId:", loggedInUserId);

  // const pageTitle = viewedUserId === loggedInUserId ? "My Posts" : ` ${viewedUserId} Posts`;
  const pageTitle = viewedUserId === loggedInUserId ? "My Posts" : "Posts";

   // Apply dark mode class to the body
   useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
  }, [darkMode]);
  
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

        // if (!userId || !token) {
        //   setError("User ID or token is missing.");
        //   return;
        // }

        if (!viewedUserId) {
          setError("User ID is missing.");
          return;
        }

        setLoading(true); // Set loading to true before the API call


        const response = await axios.get(
          `${API_BASE_URL}/api/user/${viewedUserId}/posts`,
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
  }, [viewedUserId,pageNumber]); // Trigger effect when the page number changes

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

  // if (loading && pageNumber === 0) return <div>Loading...</div>;
  // if (error) return <div className="error">{error}</div>;

  const handlePostDelete = (deletedPostId) => {
    setPosts((prevPosts) => prevPosts.filter((p) => p.postId !== deletedPostId));
  };

  return (
    <div className={`my-posts-container ${darkMode ? "dark" : "light"}`}>
    <div className={`my-posts ${darkMode ? "dark" : "light"}`} ref={postsContainerRef}>
    <h1>{pageTitle}</h1>


    {/* Error Handling */}
    {error && <div className="error">{error}</div>}

    {/* Initial Loading */}
    {loading && posts.length === 0 && (
      <div className="loading-indicator">Loading...</div>
    )}

     {/* Posts Display with Ad after every 4 posts */}
     {posts.length > 0 ? (
        posts.map((post, index) => (
          <React.Fragment key={post.postId}>
            <SinglePost post={post} darkModeFromDashboard={darkMode} onDelete={handlePostDelete} />
            {(index + 1) % 4 === 0 && <AdSenseComponent />}
          </React.Fragment>
        ))
      ) : (
      /* No Posts Message */
      !loading && <div className="no-posts">You have not created any posts yet.</div>
    )}

    {/* Loading More Posts */}
    {loading && posts.length > 0 && (
      <div className="loading-indicator">Loading more posts...</div>
    )}
  </div>
  </div>
  );
};

export default MyPosts;
