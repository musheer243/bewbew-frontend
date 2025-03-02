import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/EditProfile.css';

//
const EditProfile = () => {
  const [user, setUser] = useState({
    name: '',
    username: '',
    about: '',
    profilepic: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    // Auto-fill user details on mount from cached data or API call
    const cachedProfile = localStorage.getItem("cachedProfile");
    if (cachedProfile) {
      const profileData = JSON.parse(cachedProfile);
      setUser({
        name: profileData.name || '',
        username: profileData.username || '',
        about: profileData.about || '',
        profilepic: profileData.profilepic || ''
      });
      setPreview(profileData.profilepic || '');
    } else {
      const fetchUser = async () => {
        try {
          const userId = localStorage.getItem("userId");
          const token = localStorage.getItem("jwtToken");
          if (!userId || !token) {
            toast.error("User not authenticated");
            return;
          }
          const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.status === 200) {
            const profileData = response.data;
            setUser({
              name: profileData.name || '',
              username: profileData.username || '',
              about: profileData.about || '',
              profilepic: profileData.profilepic || ''
            });
            setPreview(profileData.profilepic || '');
          }
        } catch (error) {
          toast.error("Failed to load profile data");
        }
      };
      fetchUser();
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      }
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("jwtToken");
    if (!userId || !token) {
      toast.error("User not authenticated");
      return;
    }

    // Create a FormData object for the multipart/form-data request
    const formData = new FormData();
    formData.append("userDto", JSON.stringify({
      name: user.name,
      username: user.username,
      about: user.about
    }));
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/${userId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.status === 200) {
        toast.success("Profile updated successfully!");
        localStorage.setItem("cachedProfile", JSON.stringify(response.data));
        setUser({
          ...user,
          profilepic: response.data.profilepic
        });
      }
    } catch (error) {
      console.error("Error updating profile", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="edit-profile-container">
        <ToastContainer />
      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <div className="profile-pic-section">
          <div className="profile-pic-wrapper">
            <img 
              src={preview || "https://bewbew-images-bucket.s3.amazonaws.com/profile_pic.jfif"} 
              alt="Profile" 
              className="profile-pic" 
            />
          </div>
          <label className="change-btn">
            Change
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              hidden 
            />
          </label>
        </div>
        <div className="input-group">
          <label>Name</label>
          <input 
            type="text" 
            name="name" 
            value={user.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="input-group">
          <label>Username</label>
          <input 
            type="text" 
            name="username" 
            value={user.username} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="input-group">
          <label>About</label>
          <textarea 
            name="about" 
            value={user.about} 
            onChange={handleChange} 
            rows="4" 
          />
        </div>
        <button type="submit" className="submit-btn">Update Profile</button>
      </form>
    </div>
  );
};

export default EditProfile;