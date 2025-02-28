import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { FaArrowLeft, FaSearch, FaTimes, FaEllipsisV, FaTrash } from 'react-icons/fa';
import '../../styles/ChatPage.css';
import { API_BASE_URL, WEBSOCKET_URL } from '../../config';

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userToChat = location.state?.userToChat || null;

  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const loadingMoreRef = useRef(false);

  // Get user ID and token from localStorage
  const userId = localStorage.getItem('userId');
  const jwtToken = localStorage.getItem('jwtToken');
  const cachedProfile = localStorage.getItem('cachedProfile');
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

  // WebSocket connection & subscriptions (for messages and read-status)
  useEffect(() => {
    if (!userId) return;
    const socket = new SockJS(`${WEBSOCKET_URL}`);
    stompClient.current = Stomp.over(socket);
    const headers = { Authorization: `Bearer ${jwtToken}` };

    stompClient.current.connect(headers, () => {
      // Subscription for incoming messages
      stompClient.current.subscribe(`/user/queue/messages`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        const isMyMessage = receivedMessage.senderId === parseInt(userId);
        const newMsg = {
          ...receivedMessage,
          sender: isMyMessage ? 'me' : 'other',
          timestamp: new Date(receivedMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => {
          const existingIndex = prev.findIndex(
            m => m.senderId === receivedMessage.senderId && m.content === receivedMessage.content
          );
          if (existingIndex !== -1) {
            if ((!prev[existingIndex].id || prev[existingIndex].id === 0) && newMsg.id && newMsg.id !== 0) {
              const updatedMessages = [...prev];
              updatedMessages[existingIndex] = { ...prev[existingIndex], ...newMsg };
              return updatedMessages;
            }
            return prev;
          }
          return [...prev, newMsg];
        });

        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 0);
      });

      // Subscription for read-status notifications (from backend /read mapping)
      stompClient.current.subscribe(`/user/queue/read-status`, (message) => {
        const readUpdate = JSON.parse(message.body);
        setMessages(prev =>
          prev.map(m =>
            m.id === readUpdate.id ? { ...m, read: true } : m
          )
        );
      });
    });

    return () => {
      if (stompClient.current) stompClient.current.disconnect();
    };
  }, [userId, jwtToken]);

  // Send read update via WebSocket for each unread message from the other user
  useEffect(() => {
    if (selectedUser && stompClient.current) {
      messages.forEach((msg) => {
        if (msg.sender === 'other' && !msg.read && msg.id && msg.id !== 0) {
          const readDto = { id: msg.id };
          stompClient.current.send('/app/read', {}, JSON.stringify(readDto));
        }
      });
    }
  }, [selectedUser, messages]);

  // Search users with sanitization
  const handleSearchChange = async (e) => {
    const term = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
    setSearchTerm(term);
    if (term.trim()) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/search/${encodeURIComponent(term)}`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
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
      }
    };
    if (!searchTerm) fetchRecentChats();
  }, [searchTerm, userId, jwtToken]);

  // Toggle three-dot menu for a chat item
  const toggleMenu = (uId) => {
    setOpenMenuUserId(prev => (prev === uId ? null : uId));
  };

  // Delete chat for current user only
  const handleDeleteChatForMe = async (user) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/messages/delete/chat/${userId}/${user.id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      if (response.ok) {
        setRecentChats(prev => prev.filter(u => u.id !== user.id));
      } else {
        console.error("Failed to delete chat for me");
      }
    } catch (error) {
      console.error("Error deleting chat for me:", error);
    }
    setOpenMenuUserId(null);
  };

  // Delete entire chat history for both users
  const handleDeleteFullChat = async (user) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/messages/delete/fullchat/${userId}/${user.id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      if (response.ok) {
        setRecentChats(prev => prev.filter(u => u.id !== user.id));
      } else {
        console.error("Failed to delete full chat");
      }
    } catch (error) {
      console.error("Error deleting full chat:", error);
    }
    setOpenMenuUserId(null);
  };

  // Select user and load messages
  const handleUserClick = async (selectedUser) => {
    setSelectedUser(selectedUser);
    setPage(0);
    setHasMore(true);
    setIsLoading(true);
    setInitialLoadComplete(false);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/messages/page/${userId}/${selectedUser.id}?page=0&size=20`,
        { headers: { Authorization: `Bearer ${jwtToken}` } }
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

  // Scroll to bottom on initial chat load
  useEffect(() => {
    if (selectedUser && initialLoadComplete && page === 0 && messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 0);
    }
  }, [selectedUser, initialLoadComplete, page]);

  // Auto-select user if coming from a different page
  useEffect(() => {
    if (userToChat) {
      handleUserClick(userToChat);
    }
  }, [userToChat]);

  // Send message via WebSocket
  const handleSendMessage = () => {
    if (newMessage.trim() && stompClient.current) {
      const message = {
        senderId: parseInt(userId),
        receiverId: selectedUser.id,
        content: newMessage
      };
      stompClient.current.send('/app/chat', {}, JSON.stringify(message));
      setNewMessage('');
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 0);
    }
  };

  // Process messages: convert sentAt timestamp and set sender field
  const processMessages = (msgs) => {
    return msgs.map(msg => {
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

  // Infinite scroll: load more messages
  const loadMoreMessages = async () => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setIsLoading(true);
    const container = messagesContainerRef.current;
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
      prevScrollTopRef.current = container.scrollTop;
    }
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `${API_BASE_URL}/api/v1/messages/page/${userId}/${selectedUser.id}?page=${nextPage}&size=20`,
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      const data = await response.json();
      const orderedNewMessages = processMessages(data.content).reverse();
      setMessages(prev => [...orderedNewMessages, ...prev]);
      setPage(nextPage);
      setHasMore(!data.last);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Adjust scroll after new messages load
  useLayoutEffect(() => {
    if (loadingMoreRef.current) {
      const container = messagesContainerRef.current;
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = prevScrollTopRef.current + (newScrollHeight - prevScrollHeightRef.current);
      }
      loadingMoreRef.current = false;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!initialLoadComplete) return;
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop < 100) {
        loadMoreMessages();
      }
    }
  };

  // Delete a single message
  const handleDeleteMessage = async (messageId) => {
    if (!messageId || messageId === 0) {
      console.error("Cannot delete message: Invalid message ID", messageId);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messages/delete/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (response.ok) {
        setMessages(prevMessages => prevMessages.filter(m => m.id !== messageId));
      } else {
        console.error("Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Determine the index of the last "read" message you sent
  const lastReadIndex = messages.reduce((lastIndex, msg, index) => {
    return msg.sender === 'me' && msg.read ? index : lastIndex;
  }, -1);

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
              <div key={user.id} className="chat-page-user-item">
                <div className="user-item-content" onClick={() => handleUserClick(user)}>
                  <img 
                    src={user.profilepic || '/default-profile.png'} 
                    alt="Profile" 
                    className="chat-page-profile-pic"
                  />
                  <span>{user.username}</span>
                </div>
                <div className="user-item-menu">
                  <FaEllipsisV 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(user.id);
                    }}
                    className="ellipsis-icon"
                  />
                  {openMenuUserId === user.id && (
                    <div className="menu-dropdown">
                      <div className="menu-item" onClick={() => handleDeleteChatForMe(user)}>
                        Delete for me
                      </div>
                      <div className="menu-item" onClick={() => handleDeleteFullChat(user)}>
                        Delete for everyone
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="chat-page-active-chat">
            <div className="chat-page-messages" ref={messagesContainerRef} onScroll={handleScroll}>
              {isLoading && (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
              )}
              {messages.map((msg, index) => {
                if (msg.sender === 'other') {
                  return (
                    <div key={index} className="chat-page-message other">
                      <img
                        src={msg.senderProfilePic || '/default-profile.png'}
                        alt="Profile"
                        className="chat-page-message-profile-pic left"
                      />
                      <div className="chat-page-message-content">
                        <p>{msg.content}</p>
                        <span className="chat-page-timestamp">{msg.timestamp}</span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} className="chat-page-message me">
                      <div className="delete-icon-container">
                        <FaTrash 
                          className="delete-message-icon" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDeleteMessage(msg.id); 
                          }} 
                        />
                      </div>
                      <div className="chat-page-message-content">
                        <p>{msg.content}</p>
                        <span className="chat-page-timestamp">{msg.timestamp}</span>
                        {index === lastReadIndex && (
                          <span className="seen-label">Seen</span>
                        )}
                      </div>
                      <img
                        src={profilePic || '/default-profile.png'}
                        alt="My Profile"
                        className="chat-page-message-profile-pic right"
                      />
                    </div>
                  );
                }
              })}
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
