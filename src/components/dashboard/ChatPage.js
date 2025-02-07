import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '../../styles/ChatPage.css';
import { API_BASE_URL, WEBSOCKET_URL } from '../../config';
import { FaArrowLeft, FaSearch, FaTimes } from 'react-icons/fa';

const ChatPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  // Get user ID from localStorage
  const userId = localStorage.getItem('userId');
  const jwtToken = localStorage.getItem('jwtToken');
  const cachedProfile = localStorage.getItem('cachedProfile');

  // Parse cachedProfile if available
  let profilePic = '/default-profile.png';
  if (cachedProfile) {
    try {
      const parsedProfile = JSON.parse(cachedProfile);
      profilePic = parsedProfile.profilepic || profilePic;
    } catch (error) {
      console.error('Error parsing cachedProfile:', error);
    }
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!userId || !jwtToken) {
      navigate('/');
    }
  }, [userId, jwtToken, navigate]);

  // WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const socket = new SockJS(`${WEBSOCKET_URL}`);
    stompClient.current = Stomp.over(socket);
    
    const headers = {
      Authorization: `Bearer ${jwtToken}`
    };

    stompClient.current.connect(headers, () => {
      stompClient.current.subscribe(
        `/user/${userId}/queue/messages`,
        (message) => {
          const receivedMessage = JSON.parse(message.body);
          setMessages(prev => [...prev, {
            ...receivedMessage,
            sender: 'other',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      );
    });

    return () => {
      if (stompClient.current) stompClient.current.disconnect();
    };
  }, [userId, jwtToken]);

  // Fetch users with sanitization
  const handleSearchChange = async (e) => {
    const term = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
    setSearchTerm(term);

    if (term.trim()) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/search/${encodeURIComponent(term)}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        });
        const data = await response.json();
        setUsers(response.ok ? data : []);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else {
      setUsers([]);
    }
  };

  // Fetch recent chats
 // Fetch recent chats
useEffect(() => {
  const fetchRecentChats = async () => {
      try {
          const response = await fetch(`${API_BASE_URL}/api/v1/messages/${userId}/chats`, {
              headers: { Authorization: `Bearer ${jwtToken}` }
          });
          
          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
              const text = await response.text();
              throw new Error(`Invalid content type: ${contentType} - Response: ${text}`);
          }
          
          const data = await response.json();
          setRecentChats(data);
      } catch (error) {
          console.error('Error fetching recent chats:', error);
          setRecentChats([]);
          // Optionally show error to user
      }
  };
  
  if (!searchTerm) fetchRecentChats();
}, [searchTerm, userId, jwtToken]);
  // Select user and load messages
  const handleUserClick = async (selectedUser) => {
    setSelectedUser(selectedUser);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/messages/${userId}/${selectedUser.id}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      setMessages(data.map(msg => {
        // Convert the sentAt array into a Date object.
        // sentAt is expected as: [year, month, day, hour, minute, second, nanosecond]
        const [year, month, day, hour, minute, second, nano] = msg.sentAt;
        const millisecond = Math.floor(nano / 1e6); // convert nanoseconds to milliseconds
        const dateObj = new Date(year, month - 1, day, hour, minute, second, millisecond);
        
        return {
          ...msg,
          // Compare using senderId from the DTO
          sender: msg.senderId === parseInt(userId) ? 'me' : 'other',
          timestamp: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (newMessage.trim() && stompClient.current) {
      const message = {
        senderId: parseInt(userId),
        receiverId: selectedUser.id,
        content: newMessage
      };

      stompClient.current.send(
        '/app/chat',
        {},
        JSON.stringify(message)
      );

      setMessages(prev => [...prev, {
        ...message,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        // senderProfilePic: profilePic,
      }
    ]);
      setNewMessage('');
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!userId || !jwtToken) {
    return null;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        {/* Header when in chat view */}
        {selectedUser ? (
          <div className="chat-header">
            <button className="back-button" onClick={() => setSelectedUser(null)}>
              <FaArrowLeft />
            </button>
            <img 
              src={selectedUser.profilepic || '/default-profile.png'} 
              alt="Profile" 
              className="profile-pic"
            />
            <span>{selectedUser.username}</span>
          </div>
        ) : (
          /* Header when in list view */
          <div className="chat-header">
            <button className="back-button" onClick={() => navigate('/dashboard')}>
              <FaArrowLeft />
            </button>
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <FaTimes 
                  className="clear-icon" 
                  onClick={() => {
                    setSearchTerm('');
                    setUsers([]);
                  }} 
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="chat-content">
        {!selectedUser ? (
          <div className="users-list">
            {(searchTerm ? users : recentChats).map(user => (
              <div key={user.id} className="user-item" onClick={() => handleUserClick(user)}>
                <img 
                  src={user.profilepic || '/default-profile.png'} 
                  alt="Profile" 
                  className="profile-pic"
                />
                <span>{user.username}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="active-chat">
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  {msg.sender === 'other' && (
                    <img
                      src={msg.senderProfilePic || '/default-profile.png'}
                      alt="Profile"
                      className="message-profile-pic left"
                    />
                  )}
                  <div className="message-content">
                    <p>{msg.content}</p>
                    <span className="timestamp">{msg.timestamp}</span>
                  </div>
                  {msg.sender === 'me' && (
                    <img
                    // just added src of sender user from the cacheprofile 
                      src={profilePic || '/default-profile.png'}
                      alt="My Profile"
                      className="message-profile-pic right"
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;