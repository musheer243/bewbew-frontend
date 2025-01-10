import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://34.227.206.93:9090/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();

      if (response.ok) {
        console.log("Login successful:", data);

        // Store JWT token and user details in localStorage
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);
        localStorage.setItem("userId", data.userId);

        navigate("/dashboard");
      } else {
        console.error("Login failed:", data.message);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (    
    <div className="container mt-5">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Username</label>

          <input
            type="text"
            className="form-control"
            value={credentials.username}
            onChange={(e) =>
              setCredentials({ ...credentials, username: e.target.value })
            }
            required
          />
          
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </form>
      <p className="mt-3">
        <button
          className="btn btn-link"
          style={{ padding: 0, border: "none", background: "none" }}
          onClick={() => navigate("/forget-password")}
        >
          Forget Password?
        </button>
      </p>
      <p>
        Don't have an account?{" "}
        <button
          className="btn btn-link"
          style={{ padding: 0, border: "none", background: "none" }}
          onClick={() => navigate("/signup")}
        >
          Create one
        </button>
      </p>
      <button
        className="btn btn-outline-secondary mt-3"
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <a
          href="http://localhost:9090/api/v1/oauth2/google/login"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <img
            src={`${process.env.PUBLIC_URL}/assets/google-logo.webp`}
            alt="Google logo"
            style={{ width: "20px", height: "20px" }}
          />
          Login with Google
        </a>
      </button>
    </div>
  );
}

export default Login;
