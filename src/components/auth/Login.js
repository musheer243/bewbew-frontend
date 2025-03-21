import React, { useState } from "react";
import "../../styles/Login.css";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdOutlineLogin } from "react-icons/md";
import DOMPurify from "dompurify";
import { API_BASE_URL } from "../../config";

function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  // We won't actually toggle password visibility here, but you could if needed.
  const [showPassword] = useState(false);

  const validateInputs = () => {
    if (!credentials.username.trim()) {
      toast.error("Username/Email cannot be empty.");
      return false;
    }
    if (!credentials.password.trim()) {
      toast.error("Password cannot be empty.");
      return false;
    }
    if (credentials.password.length < 7) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  // A dedicated function that performs the actual login request
  const performLogin = async (username, password) => {
    try {
      // Send the login request
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // On success, store the token and user details, then redirect
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);
        localStorage.setItem("userId", data.userId);
        window.location.href = "/dashboard";
      } else {
        toast.error(data.message || "Login failed.");
        console.error("Login failed:", data.message);
      }
    } catch (error) {
      toast.error("An error occurred while logging in.");
      console.error("Login failed:", error);
    }
  };

  // Called when the user clicks the standard "Login" button
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate user input
    if (!validateInputs()) {
      return;
    }

    // Sanitize inputs
    const sanitizedUsername = DOMPurify.sanitize(credentials.username);
    const sanitizedPassword = DOMPurify.sanitize(credentials.password);

    // Perform the login request
    performLogin(sanitizedUsername, sanitizedPassword);
  };

  // Called when user clicks the "Demo Login" button
  const handleDemoLogin = () => {
    // Directly log in with "demo" credentials
    performLogin("demo", "demo123");
  };

  return (
    <div className="form-container sign-in-container">
      <div id="Login-page">
        <div className="login-box">
          <form onSubmit={handleSubmit}>
            <h1>Login</h1>

            {/* Login Credentials */}
            <p>Email/Username</p>
            <input
              type="text"
              placeholder="Enter here"
              name="email"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              required
            />

            <p>Password</p>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="****"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />

            <p className="mt-3">
              <Link to="/forget-password" className="forget-password-container">
                Forget Password?
              </Link>
            </p>

            <button type="submit">
              Login <MdOutlineLogin style={{ fontSize: "30px" }} />
            </button>

            <div className="or-divider">
              <span>OR</span>
            </div>

            {/* Google login button */}
            <div id="Google-button">
              <a
                href={`${API_BASE_URL}/api/v1/oauth2/google/login`}
                id="google-login-link"
                className="google-login-btn"
              >
                <img src="/assets/web_neutral_sq_SI.svg" alt="Google Logo" />
              </a>
            </div>

            <div className="signup-link">
              <span>Don't have an account? </span>
              <Link to="/signup">Sign Up</Link>
            </div>

            {/* Demo Login Button */}
            <div className="demo-login-container">
              <button
                type="button"
                className="demo-login-btn"
                onClick={handleDemoLogin}
              >
                Demo Login
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

export default Login;
