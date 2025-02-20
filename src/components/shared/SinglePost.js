import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify"; // <-- Make sure you install and import react-toastify
import "react-toastify/dist/ReactToastify.css";
import "../../styles/SinglePost.css";
import {
  // FaHeart,
  FaRegComment,
  FaBookmark,
  FaRegHeart,
  FaRegBookmark,
} from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";
// import { IoIosShareAlt } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import { HiTranslate } from "react-icons/hi";
import { PiShareFatBold } from "react-icons/pi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { API_BASE_URL } from "../../config";
import { FcLike } from "react-icons/fc";
import { IoMdClose } from "react-icons/io";
import { FaPaperPlane } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import CommentItem from "./CommentItem";
const SinglePost = ({ post, onDelete, onEdit, darkModeFromDashboard, 
  highlightCommentId, 
  highlightReplyId  }) => {
  const {
    title,
    mediaFileNames = [],
    content,
    addedDate,
    user,
    likeCount: initialLikeCount,
    saveCount: initialSaveCount,
    commentCount,
  } = post;
  const { username, profilepic } = user || {};
  const [currentIndex, setCurrentIndex] = useState(0); // Track the current image index
  const [likeCount, setLikeCount] = useState(initialLikeCount || 0);
  const [saveCount, setSaveCount] = useState(initialSaveCount || 0);
  const [liked, setLiked] = useState(false); // Track if post is liked
  const [saved, setSaved] = useState(false); // Track if post is saved
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]); // <-- Add this line
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const commentListRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false); // State for dropdown
  const [showSharePopup, setShowSharePopup] = useState(false); // Share popup state
  const [shareLink, setShareLink] = useState(""); // Shareable link

  // State to show/hide the final delete confirmation popup
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  // State for the text the user types in the confirmation field
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  useEffect(() => {
    document.title = "BewBew • My Posts";
  }, []);

  useEffect(() => {
    // Update the document body class whenever darkModeFromDashboard changes
    document.body.classList.toggle("dark-mode", darkModeFromDashboard);
  }, [darkModeFromDashboard]);

  // Auto-open modal if highlightCommentId is present
  useEffect(() => {
    if (highlightCommentId) {
      setIsModalOpen(true);
    }
  }, [highlightCommentId]);

  // Once comments are loaded, find and highlight the specific comment
  useEffect(() => {
    if (!comments.length || !highlightCommentId) return;

    const targetComment = comments.find((c) => c.id === highlightCommentId);
    if (!targetComment) return;

    // Scroll to the comment (assuming you have ref or class for each comment)
    const commentElement = document.getElementById(`comment-${highlightCommentId}`);
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
      commentElement.classList.add("highlight"); // Add a CSS class for highlighting
    }

    // Handle replies if highlightReplyId exists
    if (highlightReplyId) {
      const replyElement = document.getElementById(`reply-${highlightReplyId}`);
      if (replyElement) {
        replyElement.scrollIntoView({ behavior: "smooth", block: "center" });
        replyElement.classList.add("highlight"); // Add highlight class
      }
    }
  }, [comments, highlightCommentId, highlightReplyId]);

  // Fetch comments when the modal is opened
  useEffect(() => {
    if (isModalOpen) {
      setPage(0);
      setHasMore(true);
      fetchComments(0);
    } else {
      setComments([]);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const checkPostStatus = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          console.error("User ID or JWT token is missing.");
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/post/${post.postId}/status?userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const statusMessage = await response.text();

          // Set state based on the exact response message
          if (statusMessage === "Post is liked and saved.") {
            setLiked(true);
            setSaved(true);
          } else if (statusMessage === "Post is liked but not saved.") {
            setLiked(true);
            setSaved(false);
          } else if (statusMessage === "Post is saved but not liked.") {
            setLiked(false);
            setSaved(true);
          } else {
            setLiked(false);
            setSaved(false);
          }
        } else {
          console.error("Failed to check post status:", post.postId);
        }
      } catch (error) {
        console.error("Error checking post status:", error);
      }
    };

    checkPostStatus();
  }, [post.postId]);

  const handleLikeToggle = async () => {
    console.log("btn clicked");
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("jwtToken"); // Retrieve the token
      if (!token) {
        console.error("JWT token is missing in localStorage.");
        return;
      }

      if (!userId || !token) {
        console.error("User ID or JWT token not found in localStorage");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/post/${post.postId}/like?userId=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const message = await response.text(); // Get the string response
        if (message === "Post liked successfully!") {
          setLiked(true);
          setLikeCount((prev) => prev + 1); // Increment like count
        } else if (message === "Post unliked successfully!") {
          setLiked(false);
          setLikeCount((prev) => prev - 1); // Decrement like count
        }
        console.log(message);
      } else {
        console.error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSaveToggle = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("jwtToken"); // Retrieve the token
      if (!token || !userId) {
        console.error("User ID or JWT token is missing in localStorage.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/post/${post.postId}/save?userId=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const message = await response.text(); // Get the string response
        if (message === "Post Saved successfully!") {
          setSaved(true);
          setSaveCount((prev) => prev + 1); // Increment save count
        } else if (message === "Post UnSaved successfully!") {
          setSaved(false);
          setSaveCount((prev) => prev - 1); // Decrement save count
        }
        console.log(message);
      } else {
        console.error("Failed to toggle save");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Format addedDate (from array to readable string)
  const formattedDate = addedDate
    ? new Date(...addedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short", // Shortened month format
        day: "numeric",
      })
    : "Unknown Date";

  // Move to next image
  const nextImage = () => {
    if (currentIndex < mediaFileNames.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Move to previous image
  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
    console.log("Dropdown state:", !showOptions);
  };

  // Fetch the shareable link from the backend
  const handleShareClick = async () => {
    const frontendBaseUrl = window.location.origin; // Gets http://localhost:3000 or the deployed URL
    const shareableLink = `${frontendBaseUrl}/api/post/view/${post.postId}`;

    setShareLink(shareableLink);
    setShowSharePopup(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert("Link copied to clipboard!");
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Close dropdown if click is outside the menu-container
      if (
        !event.target.closest(".SinglePost-menu-container") &&
        !event.target.closest(".SinglePost-translate-popup")
      ) {
        setShowOptions(false);
        setShowTranslatePopup(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Fetch comments for a given page using the paginated API
  const fetchComments = async (pageNumber) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("JWT token is missing");
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/api/comments/post/${post.postId}?page=${pageNumber}&size=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        // Assuming your response has "content" (array) and "totalPages"
        if (pageNumber === 0) {
          setComments(data.content);
        } else {
          setComments((prevComments) => [...prevComments, ...data.content]);
        }
        // If this is the last page, disable further fetches
        if (pageNumber >= data.totalPages - 1) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        console.error("Failed to fetch comments");
      }
    } catch (error) {
      console.error("Error fetching comments", error);
    }
    setLoading(false);
  };

  // When the comment modal opens, load the first page of comments
  useEffect(() => {
    if (isModalOpen) {
      setPage(0);
      setHasMore(true);
      fetchComments(0);
    } else {
      // Optionally clear the comments when the modal is closed
      setComments([]);
    }
  }, [isModalOpen]);

  // When the page number increases (and is not 0), fetch the next page
  useEffect(() => {
    if (page !== 0) {
      fetchComments(page);
    }
  }, [page]);

  // Attach a scroll listener to the comment list container for infinite scrolling
  useEffect(() => {
    const container = commentListRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (
        container.scrollTop + container.clientHeight >=
          container.scrollHeight - 5 &&
        !loading &&
        hasMore
      ) {
        setPage((prevPage) => prevPage + 1);
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [loading, hasMore]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setComment(""); // Clear the input when closing
  };

  const handleCommentClick = () => {
    setIsModalOpen(true);
    console.log("Modal Open:", isModalOpen);
  };

  const MAX_COMMENT_LENGTH = 255;

  const handleSendComment = async () => {
    if (comment.trim()) {
      if (comment.length > MAX_COMMENT_LENGTH) {
        toast.error(
          `Comment should be less than ${MAX_COMMENT_LENGTH} characters.`
        );
        return;
      }
      try {
        const token = localStorage.getItem("jwtToken");
        const userId = localStorage.getItem("userId");
        if (!token || !userId) {
          console.error("JWT token or userId is missing");
          return;
        }

        // Prepare the payload (only content is required; backend will set date, etc.)
        const payload = { content: comment };

        const response = await fetch(
          `${API_BASE_URL}/api/post/${post.postId}/user/${userId}/comments/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          // The API returns the complete CommentDto object
          const newComment = await response.json();
          // Update the comments list (appending the new comment)
          setComments([...comments, newComment]);
          setComment(""); // Clear input field
        } else {
          console.error("Failed to post comment");
        }
      } catch (error) {
        console.error("Error posting comment:", error);
      }
    }
  };

  // 20 popular languages, including Marathi (mr) & Hindi (hi) as priority
  const popularLanguages = [
    { code: "hi", name: "Hindi" },
    { code: "mr", name: "Marathi" },
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "ru", name: "Russian" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "ar", name: "Arabic" },
    { code: "pt", name: "Portuguese" },
    { code: "bn", name: "Bengali" },
    { code: "pa", name: "Punjabi" },
    { code: "id", name: "Indonesian" },
    { code: "vi", name: "Vietnamese" },
    { code: "th", name: "Thai" },
    { code: "tr", name: "Turkish" },
    { code: "ur", name: "Urdu" },
  ];

  // Translate popup states
  const [showTranslatePopup, setShowTranslatePopup] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("hi"); // default to Hindi
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const translateDropdownRef = useRef(null);
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Compute the display name for the selected language
  const selectedLanguageName =
    popularLanguages.find((lang) => lang.code === selectedLanguage)?.name ||
    "Select Language";

  const toggleTranslatePopup = () => {
    setShowTranslatePopup(!showTranslatePopup);
  };

  // Function to call the translate API.
  const translatePost = async () => {
    setIsTranslating(true);
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("JWT token is missing");
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/api/post/${post.postId}/translate?language=${selectedLanguage}`,
        {
          method: "POST", // Use POST instead of default GET
          headers: {
            "Content-Type": "application/json", // Optional if no body is sent, but good practice
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setTranslatedTitle(data.title);
      setTranslatedContent(data.content);
      // Close the popup after translation (optional)
      setShowTranslatePopup(false);
    } catch (error) {
      console.error("Error translating post:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Toggle the final delete popup
  const handleDeleteClick = () => {
    setShowOptions(false); // close the 3-dot menu
    setShowDeletePopup(true); // show the confirmation popup
  };

  // Close the final delete popup
  const closeDeletePopup = () => {
    setShowDeletePopup(false);
    setDeleteConfirmationText("");
  };

  // Call the API to delete the post if the typed text is "DELETE"
  const handleConfirmDelete = async () => {
    if (deleteConfirmationText.trim().toUpperCase() === "DELETE") {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          console.error("JWT token is missing");
          return;
        }
        const response = await fetch(
          `${API_BASE_URL}/api/posts/${post.postId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          // Show a toast notification instead of console.log
          toast.success("Post deleted successfully!");
          console.log("Post deleted successfully!");
          if (onDelete) {
            onDelete(post.postId); // Tell parent to remove this post
          }
        } else {
          console.error("Failed to delete the post.");
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      } finally {
        // Close popup after attempting delete
        setShowDeletePopup(false);
        setDeleteConfirmationText("");
      }
    } else {
      alert('Please type "DELETE" exactly to confirm.');
    }
  };

  const navigate = useNavigate();
  const handleEditClick = () => {
    // Close the 3-dot menu if open
    setShowOptions(false);

    // Navigate to CreatePostPage, passing a flag & the post data
    navigate("/create-post", {
      state: {
        isEdit: true, // So we know it's edit mode
        postToEdit: post, // The post data to edit
      },
    });
  };

  return (
    <div className="SinglePost-single-post-container">
      <div className="SinglePost-single-post">
        {/* Post Header */}
        <div className="SinglePost-post-header">
          <div className="SinglePost-user-info">
            <img
              src={profilepic}
              alt="Profile"
              className="SinglePost-profile-pic"
            />
            <span className="SinglePost-username">{username}</span>
          </div>
          <div className="SinglePost-menu-container">
            <button className="SinglePost-menu-btn" onClick={toggleOptions}>
              <BsThreeDotsVertical />
            </button>
            <div
              className={`SinglePost-dropdown-menu ${
                showOptions ? "SinglePost-show" : ""
              }`}
            >
              <button
                className="SinglePost-dropdown-item"
                onClick={handleEditClick}
              >
                <MdEdit style={{ marginRight: "8px" }} />
                Edit
              </button>
              {/* <button className="SinglePost-dropdown-item">
                <IoIosShareAlt style={{ marginRight: "8px" }} />
                Share
              </button>
              <button className="SinglePost-dropdown-item">
                <HiTranslate style={{ marginRight: "8px" }} />
                Translate
              </button> */}
              <button
                className="SinglePost-dropdown-item"
                onClick={handleDeleteClick}
              >
                <MdDelete style={{ marginRight: "8px" }} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="SinglePost-post-header-divider"></div>

        <h2 className="SinglePost-post-title" style={{ fontSize: "20px" }}>
          {translatedTitle || title}
        </h2>

        <div className="SinglePost-post-media">
          {mediaFileNames.length > 0 && (
            <div className="SinglePost-media-container">
              <div className="SinglePost-aspect-ratio-box">
                {mediaFileNames[currentIndex].endsWith(".mp4") ? (
                  <video
                    controls
                    src={mediaFileNames[currentIndex]}
                    className="SinglePost-media-video"
                  />
                ) : (
                  <img
                    src={mediaFileNames[currentIndex]}
                    alt={`Media ${currentIndex + 1}`}
                    className="SinglePost-main-image"
                  />
                )}
              </div>
              {mediaFileNames.length > 1 && (
                <>
                  <button className="SinglePost-prev-btn" onClick={prevImage}>
                    ←
                  </button>
                  <button className="SinglePost-next-btn" onClick={nextImage}>
                    →
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <p className="SinglePost-post-content">
          {translatedContent || content}
        </p>

        <div className="SinglePost-translate-container">
          <button
            className="SinglePost-translate-button"
            onClick={toggleTranslatePopup}
          >
            <HiTranslate /> Translate
          </button>

          {/* Translate Popup */}
          {showTranslatePopup && (
            <div className="SinglePost-translate-popup">
              <div className="SinglePost-translate-row">
                <span className="SinglePost-translate-label">Translate to</span>
                <div
                  className="SinglePost-language-dropdown"
                  ref={translateDropdownRef}
                >
                  <div
                    className="SinglePost-selected-option"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    {selectedLanguageName}{" "}
                    <IoIosArrowDown style={{ size: 20 }} />
                  </div>
                  {dropdownOpen && (
                    <div className="SinglePost-dropdown-options">
                      {popularLanguages.map((lang) => (
                        <div
                          key={lang.code}
                          className="SinglePost-language-option"
                          onClick={() => {
                            setSelectedLanguage(lang.code);
                            setDropdownOpen(false);
                          }}
                        >
                          {lang.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Button to trigger the translation API call */}
                <button
                  className="SinglePost-apply-translation-btn"
                  onClick={translatePost}
                  disabled={isTranslating}
                >
                  {isTranslating ? "..." : <HiTranslate />}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* FOOTER */}

        <div className="SinglePost-post-footer">
          <div className="SinglePost-post-buttons">
            <button className="SinglePost-like-btn" onClick={handleLikeToggle}>
              {liked ? <FcLike /> : <FaRegHeart />}
              <span className="SinglePost-count">{likeCount}</span>
            </button>
            <button
              className="SinglePost-comment-btn"
              onClick={handleCommentClick}
            >
              <FaRegComment />
              <span className="SinglePost-count">{commentCount}</span>
            </button>
            {isModalOpen && (
              <div className="SinglePost-comment-modal">
                <div className="SinglePost-modal-header">
                  <h3>Comments</h3>
                  <button
                    className="SinglePost-close-btn2"
                    onClick={handleCloseModal}
                  >
                    <IoMdClose />
                  </button>
                </div>
                <div className="SinglePost-comment-list" ref={commentListRef}>
                  {comments && comments.length > 0 ? (
                    comments.map((c) => (
                      <CommentItem
                        key={c.id}
                        comment={c}
                        isHighlighted={c.id === highlightCommentId}
                        highlightReplyId={highlightReplyId}
                        onEdit={(updatedComment) => {
                          setComments((prevComments) =>
                            prevComments.map((comm) =>
                              comm.id === updatedComment.id ? updatedComment : comm
                            )
                          );
                        }}
                        onDelete={(deletedComment) => {
                          setComments((prevComments) =>
                            prevComments.filter((comm) => comm.id !== deletedComment.id)
                          );
                        }}
                      />
                    ))
                  ) : (
                    <p className="SinglePost-no-comments">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
                <div className="SinglePost-comment-input">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                  />
                  <button
                    className="SinglePost-send-btn"
                    onClick={handleSendComment}
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            )}
            <button className="SinglePost-save-btn" onClick={handleSaveToggle}>
              {saved ? <FaBookmark /> : <FaRegBookmark />}
              <span className="SinglePost-count">{saveCount}</span>
            </button>
            <button className="SinglePost-share-btn" onClick={handleShareClick}>
              <PiShareFatBold />
            </button>
          </div>
          <span className="SinglePost-post-date">{formattedDate}</span>
        </div>
      </div>
      {showSharePopup && (
        <div className="SinglePost-share-popup">
          <button
            onClick={() => setShowSharePopup(false)}
            className="SinglePost-close-btn"
          >
            <IoClose size={20} />
          </button>
          <p>Share this link:</p>
          <input
            type="text"
            value={shareLink}
            readOnly
            className="SinglePost-share-input"
          />
          <button onClick={copyToClipboard} className="SinglePost-copy-btn">
            Copy Link
          </button>
        </div>
      )}
      {/* The final "Are you sure?" popup */}
      {showDeletePopup && (
        <div className="SinglePost-delete-popup-overlay">
          <div className="SinglePost-delete-popup">
            <button
              className="SinglePost-delete-popup-close-btn"
              onClick={closeDeletePopup}
            >
              <IoClose size={20} />
            </button>

            <h3 className="SinglePost-delete-popup-title">
              Are you sure you want to delete this post?
            </h3>
            <p className="SinglePost-delete-popup-instruction">
              Type <strong>DELETE</strong> in the box below to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="SinglePost-delete-input"
              placeholder='Type "DELETE" here'
            />
            <button
              className="SinglePost-delete-confirm-btn"
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default SinglePost;
