import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoImagesOutline } from "react-icons/io5";
import { CiCamera } from "react-icons/ci";
import { FaCircleDot } from "react-icons/fa6";
import { MdAddPhotoAlternate } from "react-icons/md";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/CreatePostPage.css";
import { API_BASE_URL } from "../../config";

function CreatePostPage() {
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 1) Check if this is Edit mode or Create mode
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  const location = useLocation();
  const isEdit = location.state?.isEdit || false;
  const postToEdit = location.state?.postToEdit || null;

  // For the form fields
  const [title, setTitle] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [content, setContent] = useState("");
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);

  // For category & schedule (only used in create mode)
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  // For media preview & camera
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Auth & navigation
  const jwtToken = localStorage.getItem("jwtToken");
  const navigate = useNavigate();

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 2) If Edit Mode, Pre-Fill
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  useEffect(() => {
    if (isEdit && postToEdit) {
      setTitle(postToEdit.title || "");
      setContent(postToEdit.content || "");
      setCloseFriendsOnly(postToEdit.closeFriendsOnly || false);
      
    }
  }, [isEdit, postToEdit]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 3) Fetch Categories (only if creating)
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  useEffect(() => {
    if (!isEdit) {
      const fetchCategories = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/categories/`, {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            const sorted = data.sort((a, b) =>
              (a?.categoryTitle || "").localeCompare(b?.categoryTitle || "", undefined, {
                sensitivity: "base",
              })
            );
            setCategories(sorted);
            setFilteredCategories(sorted);
          } else {
            console.error("Failed to fetch categories");
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      };
      fetchCategories();
    }
  }, [isEdit, jwtToken]);

  // Filter categories on search
  useEffect(() => {
    setFilteredCategories(
      searchKeyword.trim() === ""
        ? categories
        : categories.filter((cat) =>
            cat?.categoryTitle?.toLowerCase().includes(searchKeyword.toLowerCase())
          )
    );
  }, [searchKeyword, categories]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 4) handlePostSubmit - 
  //    if isEdit => PUT update
  //    else => POST create
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  const handlePostSubmit = async (e) => {
    e.preventDefault();

    // EDIT MODE
    if (isEdit) {
      // Validate fields (title or content must exist)
      if (!title && !content) {
        toast.error("Title or content is required to update.");
        return;
      }
      // If your requirement is that media can't be empty, check if 
      // both new mediaFiles is empty and there's no old media in postToEdit
      const hasOldMedia = postToEdit.mediaFileNames?.length > 0;
      if (mediaFiles.length === 0 && !hasOldMedia) {
        toast.error("You cannot remove all media. Please select at least one file.");
        return;
      }

      // Build FormData
      const formData = new FormData();
      formData.append(
        "postDto",
        JSON.stringify({
          title,
          content,
          closeFriendsOnly,
        })
      );
      // If the user selected new files, append them
      if (mediaFiles.length > 0) {
        mediaFiles.forEach((file) => formData.append("mediaFiles", file));
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/post/${postToEdit.postId}/updateWithMedia`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
            body: formData,
          }
        );

        if (response.ok) {
          const updatedPost = await response.json();
          toast.success("Post updated successfully!");
          // Optionally navigate back to dashboard
          navigate("/dashboard", { state: { updatedPost } });
        } else {
          toast.error("Failed to update the post.");
        }
      } catch (error) {
        toast.error("An error occurred while updating the post.");
        console.error(error);
      }

      return;
    }

    // CREATE MODE
    if (!selectedCategoryId) {
      toast.error("Please select a category.");
      return;
    }
    if (!title || !content) {
      toast.error("Title and content are required.");
      return;
    }
    if (mediaFiles.length === 0) {
      toast.error("Cannot create a post without any media!");
      return;
    }

    // Build FormData for create
    const formData = new FormData();
    formData.append(
      "postDto",
      JSON.stringify({
        title,
        content,
        closeFriendsOnly,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      })
    );
    mediaFiles.forEach((file) => formData.append("mediaFiles", file));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/1/category/${selectedCategoryId}/posts/with-media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const newPost = await response.json();
        toast.success("Post created successfully!");
        // Reset fields
        setTitle("");
        setContent("");
        setMediaFiles([]);
        setSelectedCategoryId(null);
        setCloseFriendsOnly(false);
        setScheduledDate("");
        // Navigate back to dashboard
        navigate("/dashboard", { state: { newPost } });
      } else {
        toast.error("Failed to create post. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred while creating the post.");
      console.error(error);
    }
  };

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Media & Camera Logic
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  const handleNextMedia = () => {
    if (currentMediaIndex < mediaFiles.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };
  const handlePreviousMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };
  const handleCameraStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          videoRef.current.play();
        };
      }
    } catch (error) {
      toast.error("Error accessing the camera. Please check permissions.");
      console.error("Camera error:", error);
    }
  };
  useEffect(() => {
    if (isCameraActive && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadeddata = () => {
        videoRef.current.play();
      };
    }
  }, [isCameraActive]);
  const handleCaptureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      // Flip horizontally
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured-image.jpg", { type: "image/jpeg" });
          setMediaFiles((prev) => [...prev, file]);
          handleCloseCamera();
        }
      });
    }
  };
  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  // RENDER
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  return (
    <div className="create-post-wrapper">
      <div className="create-post-container">
        {/* Switch heading based on isEdit */}
        <h2>{isEdit ? "Edit Post" : "Create a Post"}</h2>

        <div className="title-input-container">
          <input
            type="text"
            placeholder="Enter the title of the post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />

          <div className="media-preview-container">
            <div className="media-preview">
              {mediaFiles.length > 0 && mediaFiles[currentMediaIndex] ? (
                mediaFiles[currentMediaIndex].type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(mediaFiles[currentMediaIndex])}
                    alt={`Uploaded Media ${currentMediaIndex + 1}`}
                    className="media-preview-content"
                  />
                ) : (
                  <video
                    controls
                    src={URL.createObjectURL(mediaFiles[currentMediaIndex])}
                    className="media-preview-content"
                  />
                )
              ) : (
                // If editing, we might show "existing" media placeholders
                // But for simplicity, just show the same label as create
                <label
                  htmlFor="file-upload"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <IoImagesOutline size={50} />
                  <p style={{ margin: 0 }}>
                    {isEdit
                      ? "Replace / Add Media (if you want)"
                      : "Upload Image & Videos."}
                  </p>
                </label>
              )}

              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/,video/"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length > 0) {
                    setMediaFiles((prev) => [...prev, ...files]);
                    setCurrentMediaIndex(0);
                  }
                }}
                style={{ display: "none" }}
              />

              {mediaFiles.length > 1 && (
                <div className="media-navigation">
                  <button onClick={handlePreviousMedia}>{"<"}</button>
                  <button onClick={handleNextMedia}>{">"}</button>
                </div>
              )}
            </div>

            <div className="camera-container">
              <div className="icon-controls">
                <CiCamera
                  size={30}
                  style={{ cursor: "pointer", marginRight: "10px" }}
                  onClick={handleCameraStart}
                />
                {mediaFiles.length > 0 && (
                  <MdAddPhotoAlternate
                    size={30}
                    style={{ cursor: "pointer", marginLeft: "10px" }}
                    onClick={() => document.getElementById("file-upload").click()}
                  />
                )}
              </div>

              {isCameraActive && (
                <div className="camera-fullscreen">
                  <video ref={videoRef} className="camera-video" autoPlay playsInline />
                  <FaCircleDot size={50} className="capture-btn" onClick={handleCaptureImage} />
                  <button className="close-btn" onClick={handleCloseCamera}>
                    X
                  </button>
                </div>
              )}
            </div>
          </div>

          <textarea
            placeholder="Enter the content of the post"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            className="textarea-field"
          />

          {/* Hide category & schedule if editing */}
          {!isEdit && !isCameraActive && (
            <>
              <div className="dropdown-container">
                <div
                  className="dropdown-header"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                >
                  {selectedCategoryId
                    ? categories.find((cat) => cat.categoryId === selectedCategoryId)
                        ?.categoryTitle
                    : "Select a category"}
                </div>
                {isDropdownOpen && (
                  <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      placeholder="Search categories"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="dropdown-search"
                    />
                    <ul className="dropdown-list">
                      {filteredCategories.map((category) => (
                        <li
                          key={category.categoryId}
                          onClick={() => {
                            setSelectedCategoryId(category.categoryId);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {category.categoryTitle}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="schedule-post-container">
                <label htmlFor="scheduled-date">Schedule Post:</label>
                <input
                  type="datetime-local"
                  id="scheduled-date"
                  name="scheduled-date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </>
          )}

          <div className="close-friends-only-container">
            <label htmlFor="close-friends-only">
              <input
                type="checkbox"
                id="close-friends-only"
                name="close-friends-only"
                checked={closeFriendsOnly}
                onChange={(e) => setCloseFriendsOnly(e.target.checked)}
              />
              Close Friends Only
            </label>
          </div>

          <button onClick={handlePostSubmit} className="submit-btn">
            {isEdit ? "Update Post" : "Create Post"}
          </button>
        </div>
      </div>

      {/* Toast container if you haven't already placed it in App.js */}
      <ToastContainer />
    </div>
  );
}

export default CreatePostPage;
