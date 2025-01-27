import React, { useState, useEffect } from "react";
import "../../styles/CreatePostPage.css";
import { API_BASE_URL } from "../../config";

function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [content, setContent] = useState("");
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const jwtToken = localStorage.getItem("jwtToken"); // Replace this with your authentication mechanism

  // Fetch all categories
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

          // Sort categories alphabetically by categoryTitle
          const sortedCategories = data.sort((a, b) => {
            if ((a?.categoryTitle || "").toLowerCase() < (b?.categoryTitle || "").toLowerCase()) return -1;
            if ((a?.categoryTitle || "").toLowerCase() > (b?.categoryTitle || "").toLowerCase()) return 1;
            return 0;
          });

          setCategories(sortedCategories);
          setFilteredCategories(sortedCategories); // Show all categories initially
        } else {
          console.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [jwtToken]);

  useEffect(() => {
    if (searchKeyword.trim() === "") {
      setFilteredCategories(categories); // Already sorted
    } else {
      setFilteredCategories(
        categories
          .filter((category) =>
            (category?.categoryTitle || "").toLowerCase().includes(searchKeyword.toLowerCase())
          )
          .sort((a, b) => {
            if ((a?.categoryTitle || "").toLowerCase() < (b?.categoryTitle || "").toLowerCase()) return -1;
            if ((a?.categoryTitle || "").toLowerCase() > (b?.categoryTitle || "").toLowerCase()) return 1;
            return 0;
          })
      );
    }
  }, [searchKeyword, categories]);

  // Handle post submission
  const handlePostSubmit = async () => {
    if (!selectedCategoryId) {
      alert("Please select a category.");
      return;
    }

    if (!title || !content) {
      alert("Title and content are required.");
      return;
    }

    const formData = new FormData();
    formData.append("postDto", JSON.stringify({ title, content }));
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
        // const data = await response.json();
        alert("Post created successfully!");
        setTitle("");
        setContent("");
        setMediaFiles([]);
        setSelectedCategoryId(null);
      } else {
        // const errorResponse = await response.json();
        alert("Failed to create post. Please try again.");
      }
    } catch (error) {
      alert("An error occurred while creating the post.");
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

  return (
    <div className="create-post-wrapper">
      <div className="create-post-container">
        <h2>Create a Post</h2>

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
      <span className="media-placeholder"></span>
    )}
    {mediaFiles.length > 1 && (
      <div className="media-navigation">
        <button onClick={handlePreviousMedia}>{"<"}</button>
        <button onClick={handleNextMedia}>{">"}</button>
      </div>
    )}
  </div>
  <input
    type="file"
    multiple
    accept="image/,video/"
    onChange={(e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        setMediaFiles(files);
        setCurrentMediaIndex(0);
      }
    }}
    className="input-field"
  />
</div>

        <textarea
          placeholder="Enter the content of the post"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="4"
          className="textarea-field"
        />

        <div className="dropdown-container">
          <div
            className="dropdown-header"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedCategoryId
              ? categories.find((cat) => cat.categoryId === selectedCategoryId)
                  ?.categoryTitle
              : "Select a category"}
          </div>
          {isDropdownOpen && (
            <div className="dropdown-menu">
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

        <button onClick={handlePostSubmit} className="submit-btn">
          Create Post
        </button>
      </div>
    </div>
  );
}

export default CreatePostPage;