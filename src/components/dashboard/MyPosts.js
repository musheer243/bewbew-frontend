import React, { useEffect, useState } from "react";
import axios from "axios";
import SinglePost from "../shared/SinglePost"; // Import the SinglePost component
import "../../styles/MyPosts.css";

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("jwtToken");

        if (!userId || !token) {
          setError("User ID or token is missing.");
          setLoading(false);
          return;
        }

        console.log("UserID:", userId); // Debugging
        console.log("Token:", token); // Debugging

        const response = await axios.get(
          `http://34.227.206.93:9090/api/user/${userId}/posts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              pageNumber: 0, // Example pagination params
              pageSize: 10,
              sortBy: "addedDate",
              sortDir: "desc",
            },
          }
        );

        if (response.status === 200) {
          console.log("API Response:", response.data); // Debugging
          setPosts(response.data.content || []); // Fallback to an empty array
        } else {
          setError("Failed to fetch posts.");
        }
      } catch (err) {
        console.error("Error fetching posts:", err); // Debugging
        setError("An error occurred while fetching posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="my-posts">
      <h1>My Posts</h1>
      {posts.length === 0 ? (
        <div className="no-posts">You have not created any posts yet.</div>
      ) : (
        posts.map((post) => <SinglePost key={post.postId} post={post} />)
      )}
    </div>
  );
};

export default MyPosts;
