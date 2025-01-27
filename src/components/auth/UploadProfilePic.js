import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../config";

function UploadProfilePic() {
  const location = useLocation(); // Get email from the previous step
  const navigate = useNavigate(); // Navigate after successful submission
  const email = location.state?.email; // Retrieve email from state
  const [image, setImage] = useState(null);

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

  return (
    <div className="container mt-5">
      <h2>Upload Profile Picture</h2>
      {email ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              disabled // Email is displayed but non-editable
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Profile Picture (optional)</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>
          <button type="submit" className="btn btn-primary">Submit</button>
        </form>
      ) : (
        <p className="text-danger">Email is missing. Please complete the registration steps.</p>
      )}
    </div>
  );
}

export default UploadProfilePic;
