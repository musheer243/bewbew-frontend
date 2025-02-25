import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from "../../config";
import "../../styles/UpdatePassword.css"

// const API_BASE_URL = 'http://your-api-url'; // Replace with your actual API base URL

const UpdatePassword = () => {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch user profile data (similar to your settings.js)
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("jwtToken");

        if (!userId || !token) {
          console.error("User ID or token is missing!");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const profileData = response.data;
          setUser(profileData);
          localStorage.setItem("cachedProfile", JSON.stringify(profileData));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    // Check cached profile in local storage
    const cachedProfile = localStorage.getItem("cachedProfile");
    if (cachedProfile) {
      setUser(JSON.parse(cachedProfile));
    } else {
      fetchProfileData();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let errors = [];

     // Local validation: new and confirm passwords must match.
     if (newPassword !== confirmPassword) {
      errors.push("New password and confirm password do not match.");
    }

    setError('');
    setMessage('');
    setLoading(true);

    // // Client-side validation: ensure new password and confirm password match
    // if (newPassword !== confirmPassword) {
    //   setError("New password and confirm password do not match.");
    //   setMessage('');
    //   return;
    // }

    // setError('');
    // setMessage('');
    // setLoading(true);
    

    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        setError("Authorization token is missing.");
        setError(errors.join(" "));
        setLoading(false);
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/users/update-password`,
        { currentPassword, newPassword, confirmPassword },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setMessage(response.data.message || "Password updated successfully.");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(response.data.message || "Failed to update password.");
      }
    } catch (err) {
      console.error("Error updating password: ", err);
      setError(err.response?.data?.message || "An error occurred while updating the password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-password-container">
      <div className="update-password-card">
        <h2 id="updatePassword">Update Password</h2>
        <label htmlFor="newPassword" className="form-label">Email:</label>
        {user && <p className="update-password-para"> {user.email}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword" className="update-password-form-label">Current Password:</label>
            <input
              id="currentPassword"
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="update-password-form-group">
            <label htmlFor="newPassword" className="form-label">New Password:</label>
            <input
              id="newPassword"
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm New Password:</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="update-password-alert" style={{ backgroundColor: '#ffdddd', color: 'red' }}>{error}</div>}
          {message && <div className="update-password-alert" style={{ backgroundColor: '#ddffdd', color: 'green' }}>{message}</div>}
          <button type="submit" className="update-password-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;