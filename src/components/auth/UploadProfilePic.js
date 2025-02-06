import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../config";
import { IoPersonOutline } from 'react-icons/io5';
import "../../styles/dUploadProfilePic.css";

function UploadProfilePic() {
  const location = useLocation(); // Get email from the previous step
  const navigate = useNavigate(); // Navigate after successful submission
  const email = location.state?.email; // Retrieve email from state
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file)); // Create a temporary preview URL
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert('Email not found. Please complete the previous steps.');
      return;
    }

    const formData = new FormData();
    formData.append('email', email); // Include email
    if (image) formData.append('image', image); // Include image if provided

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/upload-profile-pic`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        console.log("Profile updated successfully:", data);

        // Store JWT token and user details in localStorage
        localStorage.setItem("jwtToken", data.token); // Assuming data.token contains JWT token
        localStorage.setItem("username", data.username); // Assuming data contains username
        localStorage.setItem("email", data.email); // Assuming data contains email
        localStorage.setItem("userId", data.userId); // Assuming data contains userId
  
        alert("Profile updated successfully!");
                
        navigate('/dashboard', { state: { token: data.token } }); // Redirect to dashboard or next step
      } else {
        const errorMessage = await response.text();
        alert(`Profile upload failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Profile upload failed', error);
      alert('An error occurred while uploading the profile picture.');
    }
  };

  useEffect(() => {
    // Clean up the preview URL on component unmount
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
  document.title = "BewBew • Upload your Profile Photo";
}, []);

  return (
    <div id="dUploadProfilePic">
      <div className="edit-profile-container">
      <h2 className="upload-heading">Upload Profile Picture</h2>
      <form onSubmit={handleSubmit}>
          <div className="profile-card">
            <div className="profile-pic-container">
              {preview ? (
                <img src={preview} alt="Profile Preview" className="profile-pic" />
              ) : (
              
                <IoPersonOutline className='profile-pic'/>
              )}
            </div>
            <label htmlFor="file-input" className="change-photo-btn-link">
              Change photo
            </label>
            <div className="profile-info">
           <label className="emailLable" >Email</label>
              <input
                type="email"
                className="form-control email-input"
                value={email}
                disabled
              />
            </div>
            
            <input
              id="file-input"
              type="file"
              accept="image/*"
              className="file-input"
              onChange={handleImageChange}
            />
            <button type="submit" className="btn btn-primary submit-btn">Upload</button>
            <button className="btn btn-primary skip-btn">Skip</button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadProfilePic;
