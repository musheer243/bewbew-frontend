import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom'; // Import useNavigate to handle redirection
import { API_BASE_URL } from "../../config";
import "../../styles/dOtpVerification.css";
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/edit-email`, {
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp?email=${email}`, {
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
    <div className="page-container">
      <div className="container1">
        
        {!isEditingEmail ? (
          <>
            <form onSubmit={handleVerifyOtp}>
            <h2 id='otpVerification'>OTP Verification</h2>
                       <div className="mb-3 email-wrapper">
                           <label className="form-label">Email</label>
                           <input type="email" className="form-control" value={email} disabled />
                           <Link className="edit-email" onClick={() => setIsEditingEmail(true)}>
                               Edit Email
                           </Link>
                       </div>

               <div className="mb-3">
                 <label htmlFor="otp" className="form-label">
                  OTP
                 </label>
                 <input
                  type="text"
                  id="otp"
                  className="otpInput"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                 />
               </div>

                <div className="button-containerOTP">
             
                     <button type="submit" className="verify-button">
                          Verify OTP
                     </button>
                     <button
                      type="button"
                      className="resendOtp"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0}
                     >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                   </button>
        
                </div>
             </form>
           </>
        ) : (
          <form onSubmit={handleEditEmail}>
            <h2>Edit Email</h2>
            <div className="mb-3">
            
              <label htmlFor="new-email" className="form-label">
                New Email
              </label>
              <input
                type="email"
                id="new-email"
                className="form-control"
                placeholder="Enter new email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="button-containerOTP">
              <button type="submit" className="verify-button">
                Update Email
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setIsEditingEmail(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default VerifyOtp;
