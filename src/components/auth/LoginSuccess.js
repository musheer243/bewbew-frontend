import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Corrected import for named export

function LoginSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve token from query parameters
    const queryParams = new URLSearchParams(window.location.search);
    let token = queryParams.get("token");

    if (!token) {
      token = localStorage.getItem("jwtToken"); // Retrieve from localStorage
    }

    console.log("Token Retrieved:", token); // Debug log

    if (token) {
      try {
        // Decode the JWT token
        const decodedToken = jwtDecode(token);
        console.log("Decoded Token:", decodedToken); // Debug log

        // Store user details in localStorage
        localStorage.setItem("jwtToken", token);
        localStorage.setItem("email", decodedToken.email);
        localStorage.setItem("username", decodedToken.username);
        localStorage.setItem("userId", decodedToken.userId);

        // Navigate to dashboard
        navigate("/dashboard");
      } catch (error) {
        // Handle errors during token decoding
        console.error("Error decoding token:", error);
        navigate("/"); // Redirect to login on error
      }
    } else {
      // Handle missing token
      console.error("Token not found in query parameters.");
      navigate("/"); // Redirect to login if no token
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Loading...</h2>
      <p>Please wait while we redirect you.</p>
    </div>
  );
}

export default LoginSuccess;
