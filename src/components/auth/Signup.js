import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [userDetails, setUserDetails] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    about: '',
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://34.227.206.93:9090/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userDetails),
      });

      if (response.ok) {
        alert('OTP sent successfully!');
        navigate('/verify-otp', { state: { email: userDetails.email } });
      } else {
        const error = await response.text();
        alert(`Signup failed: ${error}`);
      }
    } catch (error) {
      console.error('Signup failed', error);
    }
  };
  
  return (
    <div className="container mt-5">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={userDetails.name}
            onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={userDetails.username}
            onChange={(e) => setUserDetails({ ...userDetails, username: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={userDetails.email}
            onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={userDetails.password}
            onChange={(e) => setUserDetails({ ...userDetails, password: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">About</label>
          <textarea
            className="form-control"
            value={userDetails.about}
            onChange={(e) => setUserDetails({ ...userDetails, about: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary">Register</button>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => navigate('/')}
        >
          Already a user? Login
        </button>
      </form>
    </div>
  );
}

export default Signup;
