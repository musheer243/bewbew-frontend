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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);


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
        `/user/queue/messages`,
        (message) => {
          console.log(message.body);
          const receivedMessage = JSON.parse(message.body);
          console.log(receivedMessage);
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
    setPage(0);
    setHasMore(true);
    setIsLoading(true);
    setInitialLoadComplete(false); // reset the flag on new chat selection

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/messages/page/${userId}/${selectedUser.id}?page=0&size=20`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        }
      );
      const data = await response.json();
      const orderedMessages = processMessages(data.content).reverse();
      setMessages(orderedMessages);
      setHasMore(!data.last);
      setInitialLoadComplete(true);
   } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
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

  const processMessages = (messages) => {
    return messages.map(msg => {
      const [year, month, day, hour, minute, second, nano] = msg.sentAt;
      const millisecond = Math.floor(nano / 1e6);
      const dateObj = new Date(year, month - 1, day, hour, minute, second, millisecond);
      
      return {
        ...msg,
        sender: msg.senderId === parseInt(userId) ? 'me' : 'other',
        timestamp: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });
  };

  const loadMoreMessages = async () => {
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);

    // Capture the current scroll height before loading more messages
  const container = messagesContainerRef.current;
  const prevScrollHeight = container ? container.scrollHeight : 0;

    try {
      const nextPage = page + 1;
      const response = await fetch(
        `${API_BASE_URL}/api/v1/messages/page/${userId}/${selectedUser.id}?page=${nextPage}&size=20`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        }
      );
      const data = await response.json();
      const orderedNewMessages = processMessages(data.content).reverse();
      setMessages(prev => [...orderedNewMessages, ...prev]);
      setPage(nextPage);
      setHasMore(!data.last);

      // After new messages are added, adjust the scroll position
    setTimeout(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        // This adjustment keeps the scroll position consistent
        container.scrollTop = newScrollHeight - prevScrollHeight;
      }
    }, 0);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = () => {
    if (!initialLoadComplete) return; // Ignore scroll events until initial load is complete
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      if (scrollHeight - clientHeight - scrollTop < 100) {
        loadMoreMessages();
      }
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-page-header">
        {selectedUser ? (
          <div className="chat-page-header-content">
            <button className="chat-page-back-button" onClick={() => setSelectedUser(null)}>
              <FaArrowLeft />
            </button>
            <img 
              src={selectedUser.profilepic || '/default-profile.png'} 
              alt="Profile" 
              className="chat-page-profile-pic"
            />
            <span>{selectedUser.username}</span>
          </div>
        ) : (
          <div className="chat-page-header-content">
            <button className="chat-page-back-button" onClick={() => navigate('/dashboard')}>
              <FaArrowLeft />
            </button>
            <div className="chat-page-search-container">
              <FaSearch className="chat-page-search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <FaTimes 
                  className="chat-page-clear-icon" 
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

      <div className="chat-page-content">
        {!selectedUser ? (
          <div className="chat-page-users-list">
            {(searchTerm ? users : recentChats).map(user => (
              <div key={user.id} className="chat-page-user-item" onClick={() => handleUserClick(user)}>
                <img 
                  src={user.profilepic || '/default-profile.png'} 
                  alt="Profile" 
                  className="chat-page-profile-pic"
                />
                <span>{user.username}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="chat-page-active-chat">
            <div className="chat-page-messages" ref={messagesContainerRef}
      onScroll={handleScroll}>
        {isLoading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}
              {messages.map((msg, index) => (
                <div key={index} className={`chat-page-message ${msg.sender}`}>
                  {msg.sender === 'other' && (
                    <img
                      src={msg.senderProfilePic || '/default-profile.png'}
                      alt="Profile"
                      className="chat-page-message-profile-pic left"
                    />
                  )}
                  <div className="chat-page-message-content">
                    <p>{msg.content}</p>
                    <span className="chat-page-timestamp">{msg.timestamp}</span>
                  </div>
                  {msg.sender === 'me' && (
                    <img
                      src={profilePic || '/default-profile.png'}
                      alt="My Profile"
                      className="chat-page-message-profile-pic right"
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-page-message-input">
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