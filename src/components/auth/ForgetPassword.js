import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../config";
import styles from '../../styles/ForgetPassword.module.css'; // Import the updated CSS module


function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('sendOtp'); // 'sendOtp' or 'verifyOtp'
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "BewBew • Forget Password | Can't Login In";
  }, []);

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
      const response = await fetch(`${API_BASE_URL}/api/password/verify-otp`, {
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
    <div className={`${styles.container} mt-5`}>
      <div className={styles.card}> {/* Add card class here */}
        {step === 'sendOtp' ? (
          <>
            <h2 id='forgetPassword'>Forget Password</h2>
            <form onSubmit={handleSendOtp}>
              <div className="mb-3">
                <label className={styles['form-label']}>Email</label>
                <input
                  type="email"
                  className={styles['form-control']}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={`${styles.btn} btn-primary`}>Send OTP</button>
            </form>
          </>
        ) : (
          <>
            <h2>Verify OTP</h2>
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-3">
                <label className={styles['form-label']}>Email</label>
                <input type="email" className={styles['form-control']} value={email} disabled />
              </div>
              <div className="mb-3">
                <label className={styles['form-label']}>OTP</label>
                <input
                  type="text"
                  className={styles['form-control']}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={`${styles.btn} btn-primary`}>Verify OTP</button>
            </form>
          </>
        )}
        {message && <div className={`alert alert-info mt-3 ${styles.alert}`}>{message}</div>}
      </div>
    </div>
  );
}

export default ForgetPassword;