import React, { useState } from "react";
import "../../styles/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdOutlineLogin } from "react-icons/md";
import DOMPurify from "dompurify";

function Login() {
  const [credentials, setcredentials] = useState({
    username: "",
    password: "",
  });

  const [showPassword] = useState(false); // State for password visibility
  const navigate = useNavigate(); // For redirection

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input validation
    if (!validateInputs()) {
      return;
    }

    // Sanitize inputs
    const sanitizedUsername = DOMPurify.sanitize(credentials.username);
    const sanitizedPassword = DOMPurify.sanitize(credentials.password);

    try {
      const response = await fetch(
        "http://3.225.10.130:9090/api/v1/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: sanitizedUsername,
            password: sanitizedPassword,
          }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        // Handle successful login
        toast.success("Login successful!");
        console.log("Login successful:", data);

        // Store JWT token and user details in localStorage
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("username", data.username); // Assuming data contains username
        localStorage.setItem("email", data.email); // Assuming data contains email
        localStorage.setItem("userId", data.userId); // Assuming data contains userId
        navigate("/dashboard"); // Redirect to dashboard
      } else {
        toast.error(data.message || "Login failed.");
        console.error("Login failed:", data.message);
      }
    } catch (error) {
      toast.error("An error occurred while logging in.");
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="form-container sign-in-container">
      <div id="Login-page">
        {/* Card View Container */}
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
                setcredentials({ ...credentials, username: e.target.value })
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
                setcredentials({ ...credentials, password: e.target.value })
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
                href="https://example.com/google-login"
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
          </form>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

export default Login;
