import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../config";

function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('sendOtp'); // 'sendOtp' or 'verifyOtp'
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/password/forget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setStep('verifyOtp'); // Move to OTP verification step
      } else {
        setMessage(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setMessage('Error sending OTP. Please try again later.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://API_BASE_URL:9090/api/password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        navigate('/reset-password', { state: { email } }); // Navigate to reset password page
      } else {
        setMessage(data.message || 'Invalid OTP or OTP expired. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setMessage('Error verifying OTP. Please try again later.');
    }
  };

  return (
    <div className="container mt-5">
      {step === 'sendOtp' ? (
        <>
          <h2>Forget Password</h2>
          <form onSubmit={handleSendOtp}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Send OTP</button>
          </form>
        </>
      ) : (
        <>
          <h2>Verify OTP</h2>
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
            <button type="submit" className="btn btn-primary">Verify OTP</button>
          </form>
        </>
      )}
      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
}

export default ForgetPassword;
