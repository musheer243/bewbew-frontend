import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "../../styles/search.css";
 import { API_BASE_URL } from "../../config";

const Search = () => {
  const navigate = useNavigate();

  // State to hold the search term, the selected type, and results
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("users"); // default type is "users"
  const [results, setResults] = useState([]);
  const token = localStorage.getItem("jwtToken");


  // Function to perform the API call based on search type and search term
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    let url = "";
    if (searchType === "users") {
      url = `${API_BASE_URL}/api/users/search/${encodeURIComponent(searchTerm)}`;
    } else if (searchType === "posts") {
      url = `${API_BASE_URL}/api/posts/search/${encodeURIComponent(searchTerm)}`;
    } else if (searchType === "categories") {
      url = `${API_BASE_URL}/api/categories/search/${encodeURIComponent(searchTerm)}`;

      // url = `${API_BASE_URL}/api/categories`;

    }

    try {
      const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        console.error("Search failed");
      }
    } catch (error) {
      console.error("Error during search:", error);
    }
  };

  // Debounce the search so that the API call fires 300ms after the user stops typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchType]);

  // Update the search type (tab) while keeping the current search text
  const handleTabClick = (type) => {
    setSearchType(type);
  };

  const handleUserClick = (user) => {
    // Navigate to the profile page and pass the user data
    navigate(`/profile/${user.id}`, { state: { user } });
  };

  // Handler for clicking a post result.
  const handlePostClick = (post) => {
    // Navigate to a route that will render the detailed post view (SinglePost).
    // We pass the post data in state so that the SinglePost component can display it.
    navigate(`/api/post/view/${post.id || post.postId}`, { state: { post } });
  };

  useEffect(() => {
    console.log("API Response for categories:", results); // Check the structure of each category object
  }, [results]);
  
  return (
    <div className="search-container">
      {/* Header Section */}
      <header className="search-header">
        <div className="back-button" onClick={() => navigate("/dashboard")}>
          <FaArrowLeft className="back-icon" />
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search users, posts, categories"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* Tabs for selecting search type */}
      <div className="search-tabs">
        <button
          className={`search-tab ${searchType === "users" ? "active" : ""}`}
          onClick={() => handleTabClick("users")}
        >
          Users
        </button>
        <button
          className={`search-tab ${searchType === "posts" ? "active" : ""}`}
          onClick={() => handleTabClick("posts")}
        >
          Posts
        </button>
        <button
          className={`search-tab ${searchType === "categories" ? "active" : ""}`}
          onClick={() => handleTabClick("categories")}
        >
          Categories
        </button>
      </div>

      {/* Results Section */}
      <div className="search-results">
        {searchTerm.trim() === "" ? (
          <p className="no-search">Please enter a search term.</p>
        ) : results.length === 0 ? (
          <p className="no-results">No results found.</p>
        ) : (
          <ul className="results-list">
            {results.map((item, index) => (

              <li key={item.id || index} className="result-item"
              onClick={() => 
                // searchType === "users" && handleUserClick(item)
                {
                  if (searchType === "users") {
                  handleUserClick(item);
                } else if (searchType === "posts") {
                  handlePostClick(item);
                }

              }}
              >

                {/* USER  */}

                {searchType === "users" && (
                  <div className="result-user">
                    <img
                      src={
                        item.profilepic ||
                        "https://via.placeholder.com/40"
                      }
                      alt={item.username || "User"}
                      className="result-user-pic"
                    />
                    <span className="result-username">
                      {item.username || item.name}
                    </span>
                  </div>
                )}

                {/* POSTS */}
                {searchType === "posts" && (
                  <div className="result-post">
                    <h3 className="result-post-title">{item.title}</h3>
                    <p className="result-post-snippet">
                      {item.content
                        ? item.content.substring(0, 100) + "..."
                        : ""}
                    </p>
                  </div>
                )}

                {/* CATEGORIES */}
                {searchType === "categories" && (
                  <div className="result-category">
                    <span className="result-category-name">{item.categoryTitle}</span>

    {/* <span className="result-category-name">Category Placeholder</span> */}

                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
