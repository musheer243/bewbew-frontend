import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from "../../config";
import "../../styles/UpdatePassword.css";

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
          headers: { Authorization: `Bearer ${token}` },
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

    const cachedProfile = localStorage.getItem("cachedProfile");
    if (cachedProfile) {
      setUser(JSON.parse(cachedProfile));
    } else {
      fetchProfileData();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        setError("Authorization token is missing.");
        setLoading(false);
        return;
      }

      // Always call the API so that current password is validated by the backend.
      await axios.put(
        `${API_BASE_URL}/api/users/update-password`,
        { currentPassword, newPassword, confirmPassword },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If API call succeeds, show success message.
      setMessage("Password updated successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Perform local validation for new/confirm mismatch.
      const localError = newPassword !== confirmPassword 
        ? "New password and confirm password do not match." 
        : "";
      // Get error from the API (e.g. current password incorrect)
      const apiError = err.response?.data?.message || "";
      // Combine both errors (ignoring any empty strings)
      const combinedError = [localError, apiError].filter(Boolean).join(" ");
      setError(combinedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-password-container">
      <div className="update-password-card">
        <h2 id="updatePassword">Update Password</h2>
        <label htmlFor="email" className="update-password-form-label">Email:</label>
        {user && <p className="update-password-para">{user.email}</p>}
        <form onSubmit={handleSubmit}>
          <div className="update-password-form-group">
            <label htmlFor="currentPassword" className="update-password-form-label">
              Current Password:
            </label>
            <input
              id="currentPassword"
              type="password"
              className="update-password-form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="update-password-form-group">
            <label htmlFor="newPassword" className="form-label">
              New Password:
            </label>
            <input
              id="newPassword"
              type="password"
              className="update-password-form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="update-password-form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm New Password:
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="update-password-form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="update-password-alert error" style={{  color: 'red' }}>{error}</div>}
          {message && <div className="update-password-alert success" style={{ backgroundColor: '#ffdddd' }}>{message}</div>}
          
          <button type="submit" className="update-password-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
