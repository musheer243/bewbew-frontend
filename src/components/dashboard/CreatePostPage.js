import React, { useState, useEffect, useRef } from 'react';
import '../../styles/CreatePostPage.css';
import { IoImagesOutline } from 'react-icons/io5';
import { CiCamera } from 'react-icons/ci';
import { FaCircleDot } from "react-icons/fa6";
import { MdAddPhotoAlternate } from 'react-icons/md';
import { API_BASE_URL } from '../../config';
import { useNavigate } from 'react-router-dom';


function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const titleInputRef = useRef(null);
  const jwtToken = localStorage.getItem('jwtToken');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories/`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched categories:', data); // Add this
          const sortedCategories = data.sort((a, b) =>
            (a?.categoryTitle || '').localeCompare(b?.categoryTitle || '', undefined, {
              sensitivity: 'base',
            })
          );
          setCategories(sortedCategories);
          setFilteredCategories(sortedCategories);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [jwtToken]);

  useEffect(() => {
    setFilteredCategories(
      searchKeyword.trim() === ''
        ? categories
        : categories.filter((category) =>
            category?.categoryTitle?.toLowerCase().includes(searchKeyword.toLowerCase())
          )
    );
  }, [searchKeyword, categories]);

  const handlePostSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCategoryId) {
      alert('Please select a category.');
      return;
    }

    if (!title || !content) {
      alert('Title and content are required.');
      return;
    }

    const formData = new FormData();
    formData.append('postDto', JSON.stringify({ 
      title, 
      content, 
      closeFriendsOnly, 
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null 
    }));
    mediaFiles.forEach((file) => formData.append('mediaFiles', file));

    try {
      const response = await fetch(`
        ${API_BASE_URL}/api/user/1/category/${selectedCategoryId}/posts/with-media`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const newPost = await response.json();

        alert('Post created successfully!');
        setTitle('');
        setContent('');
        setMediaFiles([]);
        setSelectedCategoryId(null);
        setCloseFriendsOnly(false);
        setScheduledDate('');

        navigate('/dashboard', { state: { newPost } });

      } else {
        alert('Failed to create post. Please try again.');
      }
    } catch (error) {
      alert('An error occurred while creating the post.');
    }
  };

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

        // CAMERA

  const handleCameraStart = async () => {

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });

      streamRef.current = stream; // Store the stream reference
      setIsCameraActive(true); // Triggers re-render to show <video>
  
      console.log("Stream received:", stream);
      
      if (videoRef.current) {
        console.log("Video Element Found:", videoRef.current);
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          videoRef.current.play();
        };
      } else {
        console.error("Video element not found.");
      }

    } catch (error) {
      alert("Error accessing the camera. Please check permissions.");
      console.error("Camera error:", error);
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current) {
      console.log("Applying stream to video element:", videoRef.current);
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

      // Flip the canvas horizontally
    context.translate(canvas.width, 0);
    context.scale(-1, 1); // Mirrors the image

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

  

  return (
    <div className="create-post-wrapper">
      <div className="create-post-container">
        <h2>Create a Post</h2>

        <div className="title-input-container">
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Enter the title of the post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />

        <div className="media-preview-container">
          <div className="media-preview">
            {mediaFiles.length > 0 && mediaFiles[currentMediaIndex] ? (
              mediaFiles[currentMediaIndex].type.startsWith('image/') ? (
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
              <label 
                htmlFor="file-upload" 
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }}
              >
                <IoImagesOutline size={50} />
                <p style={{ margin: 0 }}>Upload Image & Videos.</p>
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
              style={{ display: 'none' }}
            />

            {mediaFiles.length > 1 && (
              <div className="media-navigation">
                <button onClick={handlePreviousMedia}>{'<'}</button>
                <button onClick={handleNextMedia}>{'>'}</button>
              </div>
            )}
          </div>

          <div className="camera-container">
            <div className="icon-controls">
              <CiCamera size={30} style={{ cursor: "pointer", marginRight: "10px" }} onClick={handleCameraStart} />
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
                <button className="close-btn" onClick={handleCloseCamera}>X</button>
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

{!isCameraActive && (
        <div className="dropdown-container">
          <div
            className="dropdown-header"
            onClick={() => {
              setIsDropdownOpen((prev) => !prev);
              console.log("Dropdown Open State:", !isDropdownOpen);
            }}
          >
            {selectedCategoryId
              ? categories.find((cat) => cat.categoryId === selectedCategoryId)?.categoryTitle
              : 'Select a category'}
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

        <button onClick={handlePostSubmit} className="submit-btn">
          Create Post
        </button>
      </div>
    </div>
    </div>
  );
}

export default CreatePostPage;