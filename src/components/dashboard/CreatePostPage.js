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

// Helper: get current local time in Asia/Kolkata as "YYYY-MM-DDTHH:MM"
function getKolkataMinDateTime() {
  // Convert the local time in Asia/Kolkata to a JS Date object
  const kolkataTimeString = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  const dateObj = new Date(kolkataTimeString);

  // Format the dateObj into "YYYY-MM-DDTHH:MM"
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function CreatePostPage() {
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 1) Check if this is Edit mode or Create mode
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  const location = useLocation();
  const isEdit = location.state?.isEdit || false;
  const postToEdit = location.state?.postToEdit || null;

  // Basic post fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);

  // Category & schedule (only used if !isEdit)
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  // Unifying old & new media
  // allMedia: array of { type: "old" | "new", url?: string, file?: File }
  const [allMedia, setAllMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Camera
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

      // Convert existing mediaFileNames => array of { type: "old", url }
      const oldArray = (postToEdit.mediaFileNames || []).map((url) => ({
        type: "old",
        url: url,
      }));
      setAllMedia(oldArray);
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
  // 4) handlePostSubmit
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  const handlePostSubmit = async (e) => {
    e.preventDefault();

    // Basic validations
    if (!title && !content) {
      toast.error("Title or content is required.");
      return;
    }

    // EDIT MODE
    if (isEdit) {
      // Separate old vs. new
      const keptOldLinks = allMedia
        .filter((item) => item.type === "old")
        .map((item) => item.url);

      const newFiles = allMedia
        .filter((item) => item.type === "new")
        .map((item) => item.file);

      // If user ended up with no old & no new => no media at all
      if (keptOldLinks.length === 0 && newFiles.length === 0) {
        toast.error("You cannot remove all media. Please select at least one file.");
        return;
      }

      // Build the PostDto with keptOldLinks
      const dto = {
        title,
        content,
        closeFriendsOnly,
        keptOldLinks, // new field so server knows which old links remain
      };

      // Build FormData
      const formData = new FormData();
      formData.append("postDto", JSON.stringify(dto));
      newFiles.forEach((file) => formData.append("mediaFiles", file));

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
    if (allMedia.length === 0) {
      toast.error("Cannot create a post without any media!");
      return;
    }

    // Only new items in create mode
    const newFiles = allMedia
      .filter((item) => item.type === "new")
      .map((item) => item.file);

    const dto = {
      title,
      content,
      closeFriendsOnly,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
    };

    const formData = new FormData();
    formData.append("postDto", JSON.stringify(dto));
    newFiles.forEach((file) => formData.append("mediaFiles", file));

    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch(
        `${API_BASE_URL}/api/user/${userId}/category/${selectedCategoryId}/posts/with-media`,
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
        navigate("/dashboard", { state: { newPost } });

        // Optionally reset or navigate
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
  function handleNextMedia() {
    if (currentIndex < allMedia.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handlePreviousMedia() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

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
    if (!videoRef.current) return;
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
        // Add to allMedia as "new"
        setAllMedia((prev) => [...prev, { type: "new", file }]);
        handleCloseCamera();
      }
    });
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  function handleRemoveMedia() {
    if (allMedia.length === 0) return;
    setAllMedia((prev) => {
      const updated = [...prev];
      updated.splice(currentIndex, 1);
      let newIndex = currentIndex;
      if (newIndex >= updated.length) {
        newIndex = updated.length - 1;
      }
      setCurrentIndex(Math.max(newIndex, 0));
      return updated;
    });
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newItems = files.map((file) => ({
        type: "new",
        file: file,
      }));
      setAllMedia((prev) => [...prev, ...newItems]);
      // Move currentIndex to the newly added item if you want,
      // or keep it as is. We'll do minimal approach:
      setCurrentIndex((prev) => (prev < 0 ? 0 : prev));
    }
  }

  function renderPreview() {
    if (allMedia.length === 0) {
      // Fallback label if no media
      return (
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
            {isEdit ? "Replace / Add Media (if you want)" : "Upload Image & Videos."}
          </p>
        </label>
      );
    }

    const item = allMedia[currentIndex];
    if (item.type === "old") {
      // Old server link
      if (item.url.toLowerCase().endsWith(".mp4")) {
        return <video controls src={item.url} className="media-preview-content" />;
      } else {
        return <img src={item.url} alt="OldMedia" className="media-preview-content" />;
      }
    } else {
      // It's a new file
      const src = URL.createObjectURL(item.file);
      if (item.file.type.startsWith("image/")) {
        return <img src={src} alt="NewMedia" className="media-preview-content" />;
      } else {
        return <video controls src={src} className="media-preview-content" />;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="create-post-wrapper">
      <div className="create-post-container">
        <h2>{isEdit ? "Edit Post" : "Create Post"}</h2>

        <div className="title-input-container">
          <input
            type="text"
            placeholder="Enter the title of the post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />

          <div className="media-preview-container">
            {/* Show the "X" button only if we have at least one item */}
            {allMedia.length > 0 && (
              <div className="media-item-wrapper">
                <button className="remove-media-btn" onClick={handleRemoveMedia}>
                  X
                </button>
              </div>
            )}

            <div className="media-preview">
              {renderPreview()}

              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/,video/"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              {allMedia.length > 1 && (
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
                {/* Show AddPhoto icon if we have media or we are editing */}
                {(allMedia.length > 0 || isEdit) && (
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
                  <FaCircleDot
                    size={50}
                    className="capture-btn"
                    onClick={handleCaptureImage}
                  />
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
                <div className="dropdown-header" onClick={() => setIsDropdownOpen((prev) => !prev)}>
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
                  min={getKolkataMinDateTime()}

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

      <ToastContainer />
    </div>
  );
}

export default CreatePostPage;
