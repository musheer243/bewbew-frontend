import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate to handle redirection

function VerifyOtp() {
  const location = useLocation(); // Access the location object
  const navigate = useNavigate(); // Initialize navigate
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState(location.state?.email || ''); // Access email from the state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0); // Timer for resend OTP

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000); // Decrease timer by 1 second
      return () => clearTimeout(timer); // Clear timeout on component unmount
    }
  }, [resendTimer]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://3.225.10.130:9090/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.text();
      alert(data); // Displays success or error message

      if (response.ok) {
        // Redirect to the profile picture upload page
        navigate('/upload-profile-pic', { state: { email } });
      }
    } catch (error) {
      console.error('OTP verification failed', error);
    }
  };

  const handleEditEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://3.225.10.130:9090/api/v1/auth/edit-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ oldEmail: email, newEmail }),
      });
      const data = await response.text();
      alert(data); // Displays success or error message
      if (response.ok) {
        setEmail(newEmail); // Update the email
        setIsEditingEmail(false); // Exit edit mode
      }
    } catch (error) {
      console.error('Email update failed', error);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch(`http://3.225.10.130:9090/api/v1/auth/resend-otp?email=${email}`, {
        method: 'POST',
      });
      const data = await response.text();
      alert(data); // Displays success or error message
      if (response.ok) {
        setResendTimer(300); // Set 5-minute timer (300 seconds)
      }
    } catch (error) {
      console.error('Resend OTP failed', error);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Verify OTP</h2>
      {!isEditingEmail ? (
        <>
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} disabled />
            </div>
            <div className="mb-3">
              <label className="form-label">OTP</label>
              <input
                type="text"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Verify OTP
            </button>
          </form>
          <div className="mt-3">
            <button
              className="btn btn-link"
              onClick={() => setIsEditingEmail(true)}
            >
              Edit Email
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleResendOtp}
              disabled={resendTimer > 0}
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleEditEmail}>
          <div className="mb-3">
            <label className="form-label">New Email</label>
            <input
              type="email"
              className="form-control"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Update Email
          </button>
          <button
            className="btn btn-link mt-3"
            onClick={() => setIsEditingEmail(false)}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

export default VerifyOtp;
