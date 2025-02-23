import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SinglePost from "../shared/SinglePost";
import "../../styles/MyLikedPosts.css"; 
import { API_BASE_URL } from "../../config";
import { FaArrowLeft } from "react-icons/fa";

const MySchedulePost = () => {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScheduledPosts = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("jwtToken");

        if (!userId || !token) {
          console.error("User ID or JWT token is missing");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/post/users/${userId}/scheduled-posts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setScheduledPosts(response.data);
      } catch (error) {
        console.error("Error fetching scheduled posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledPosts();
  }, []);

  if (loading && scheduledPosts.length === 0) {
    return <div>Loading scheduled posts...</div>;
  }

  return (
    <div className="post-activity-container">
      <div>
        <h3 style={{marginTop: "36px"}}>My Scheduled Posts</h3>
      </div>

      <div className="back-button" onClick={() => navigate("/setting")}>
        <FaArrowLeft className="back-icon" size={27} />
      </div>
      
      {scheduledPosts.length > 0 ? (
        <div className="post-grid">
          {scheduledPosts.map((post) => (
            <SinglePost key={post.postId} post={post} />
          ))}
        </div>
      ) : (
        <p>You haven't scheduled any posts yet.</p>
      )}
    </div>
  );
};

export default MySchedulePost;
