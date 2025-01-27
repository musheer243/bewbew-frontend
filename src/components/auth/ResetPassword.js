import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../config";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email] = useState(location.state?.email || ''); // Pre-filled from OTP verification
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, newPassword }),
      });

      const data = await response.json();
      setMessage(data.message || 'Password reset failed.');

      if (response.ok) {
        alert('Password reset successful!');
        navigate('/'); // Navigate to login after successful reset
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Reset Password</h2>
      <form onSubmit={handleResetPassword}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" value={email} disabled />
        </div>
        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-control"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Reset Password</button>
      </form>
      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
}

export default ResetPassword;
