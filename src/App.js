import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import VerifyOtp from './components/auth/VerifyOtp';
import UploadProfilePic from './components/auth/UploadProfilePic';
import ForgetPassword from './components/auth/ForgetPassword';
import ResetPassword from './components/auth/ResetPassword';
import LoginSuccess from './components/auth/LoginSuccess';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/dashboard/Profile';
import AIChatting from './components/dashboard/AIChatting';
import MyPosts from './components/dashboard/MyPosts';
import CreatePostPage from './components/dashboard/CreatePostPage';
import SharedPostViewer from './components/shared/SharedPostViewer';
import PostViewByCategory from './components/dashboard/PostViewByCategory';
import Leaderboard from './components/dashboard/Leaderboard'
import NotificationsPage from './components/dashboard/NotificationsPage';
import ChatPage from './components/dashboard/ChatPage';
import Search from './components/dashboard/Search';
import { WebSocketProvider } from './context/WebSocketContext'; // Import your provider
import Settings from './components/Setting/Setting';
import MyLikedPosts from './components/Setting/MyLikedPosts';
import MySavedPosts from './components/Setting/MySavedPost';
import MySchedulePost from './components/Setting/MySchedulePost';
function App() {
  return (
    <WebSocketProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/upload-profile-pic" element={<UploadProfilePic />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login-success" element={<LoginSuccess />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/ai-chatting" element={<AIChatting />} />
        {/* <Route path="/my-posts" element={<MyPosts />} /> */}
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/api/post/view/:postId" element={<SharedPostViewer />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/search" element={<Search />} />

        <Route path="/setting" element = {<Settings/>}/>

        <Route path="/post-activity/my-LikedPosts" element={<MyLikedPosts/>}  />
        <Route path="/post-activity/my-SavedPosts" element={<MySavedPosts/>}/>
        <Route path="/post-activity/my-ScheduledPosts" element={<MySchedulePost/>}  />
        <Route path="/my-posts" element={<MyPosts />} />
        <Route path="/posts/:userId" element={<MyPosts />} />

        <Route path="/category/:categoryId" element={<PostViewByCategory />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </Router>
    </WebSocketProvider>
  );
}

export default App;
