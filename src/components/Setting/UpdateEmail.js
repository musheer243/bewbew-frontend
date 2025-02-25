// UpdateEmail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from "../../config";
import "../../styles/UpdatePassword.css"; // You can create/update your CSS as needed

const UpdateEmail = () => {
  const [user, setUser] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: send OTP, 2: verify OTP and update email
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch user profile data on component mount
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
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    // Check if profile data is cached
    const cachedProfile = localStorage.getItem("cachedProfile");
    if (cachedProfile) {
      setUser(JSON.parse(cachedProfile));
    } else {
      fetchProfileData();
    }
  }, []);

  // Handler for sending OTP to the new email
  const handleSendOtp = async (e) => {
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

      // Use the current email from the fetched user data
      const currentEmail = user?.email;
      const response = await axios.post(`${API_BASE_URL}/api/change-email/send-otp`, null, {
        params: { currentEmail, newEmail },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setMessage(response.data.message || "OTP sent to your new email.");
        setStep(2);
      } else {
        setError(response.data.message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error("Error sending OTP: ", err);
      setError(err.response?.data?.message || "An error occurred while sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for verifying OTP and updating the email
  const handleVerifyOtp = async (e) => {
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
      const currentEmail = user?.email;
      const response = await axios.post(`${API_BASE_URL}/api/change-email/verify-otp`, null, {
        params: { currentEmail, newEmail, otp },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setMessage(response.data.message || "Email updated successfully.");
        // Update local user data with the new email
        const updatedUser = { ...user, email: newEmail };
        setUser(updatedUser);
        localStorage.setItem("cachedProfile", JSON.stringify(updatedUser));
        // Optionally, reset the form state
        setStep(1);
        setNewEmail('');
        setOtp('');
      } else {
        setError(response.data.message || "Failed to update email.");
      }
    } catch (err) {
      console.error("Error verifying OTP and updating email: ", err);
      setError(err.response?.data?.message || "An error occurred while updating email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-password-container">
      <div className="update-password-card">
        <h2 id="updateEmail">Update Email</h2>
        <label htmlFor="currentEmail" className="form-label">Current Email:</label>
        {user && <p className="update-password-para">{user.email}</p>}
        
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="newEmail" className="form-label">New Email:</label>
              <input
                id="newEmail"
                type="email"
                className="form-control"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="update-password-alert" style={{ backgroundColor: '#ffdddd', color: 'red' }}>{error}</div>}
            {message && <div className="update-password-alert" style={{ backgroundColor: '#ddffdd', color: 'green' }}>{message}</div>}
            <button type="submit" className="update-password-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="otp" className="form-label">OTP:</label>
              <input
                id="otp"
                type="text"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            {error && <div className="update-password-alert" style={{ backgroundColor: '#ffdddd', color: 'red' }}>{error}</div>}
            {message && <div className="update-password-alert" style={{ backgroundColor: '#ddffdd', color: 'green' }}>{message}</div>}
            <button type="submit" className="update-password-btn" disabled={loading}>
              {loading ? 'Verifying OTP...' : 'Verify OTP & Update Email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdateEmail;
