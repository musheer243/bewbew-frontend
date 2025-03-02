import React, { useState, useEffect } from "react";
import '../../styles/Signup.css';
import { Button, Col, Form, FormGroup, Input, Label, Row } from "reactstrap";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import the CSS for toast notificationsimport CustomNavbar from "../../Components/CustomNavbar";
import {Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";

function Signup(){
  const [userDetails, setUserDetails] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    about: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
      document.title = "BewBew • Sign Up";
      // document.title = "Sign Up For BewBew";
    }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
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

  const handleReset = () => {
    setUserDetails({
      name: "",
      username: "",
      email: "",
      password: "",
      about: ""
    });
  
  };

  return (
    <div id="Signup-page">

      <ToastContainer />

      <Row className="justify-content-center">
        <Col lg="6">
          <div className="register-box">
            <center><h3>Create a New Account</h3></center>

              {/* Divider Line */}
  <div className="line-container">
    <div className="horizontal-line"></div>
    {/* <div className="dot"></div> */}
  </div>

              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label for="name"></Label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={userDetails.name}
                    onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label for="username"></Label>
                  <Input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={userDetails.username}
                    onChange={(e) => setUserDetails({ ...userDetails, username: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label for="email"></Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={userDetails.email}
                    onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label for="password"></Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={userDetails.password}
                    onChange={(e) => setUserDetails({ ...userDetails, password: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label for="about"></Label>
                  <Input
                    type="textarea"
                    name="about"
                    placeholder="About Yourself"
                    value={userDetails.about}
                    onChange={(e) => setUserDetails({ ...userDetails, about: e.target.value })}
                  />
                </FormGroup>

                <div className="button-container">
                   <div className="text-center">
                       <Button type="submit" className="register-btn">Sign In</Button>
                       <Button type="reset" className="ms-2 reset-btn" onClick={handleReset}>Reset</Button>
                   </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',  textAlign: 'center', marginTop: '10px' }}>
                   <span style={{fontSize:'17px'}}>Have an account? </span>
                   <Link to="/" style={{margin:'10px'}}><b> Login</b></Link>
                </div>
                
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
   
              </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Signup;