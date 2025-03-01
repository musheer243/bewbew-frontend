import React, { useState, useEffect, useRef, useLayoutEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaTimes, FaEllipsisV, FaTrash } from 'react-icons/fa';
import '../../styles/ChatPage.css';
import { API_BASE_URL } from '../../config';
import { WebSocketContext } from "../../context/WebSocketContext";

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userToChat = location.state?.userToChat || null;

  // Get values from WebSocket context
  const { 
    recentChats,
    chatStompClient,
    markChatAsRead,
    fetchRecentChats  // Add this line to get the function
  } = useContext(WebSocketContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [newMessageMarker, setNewMessageMarker] = useState(null);
  const [highlightedMessages, setHighlightedMessages] = useState(new Set());

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const readMessagesRef = useRef(new Set());

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

  useEffect(() => {
    fetchRecentChats();
  }, [fetchRecentChats]);
  

  // Listen for new messages from WebSocketContext
  useEffect(() => {
    if (!chatStompClient || !selectedUser) return;

    const messageSubscription = chatStompClient.subscribe(`/user/queue/messages`, (message) => {
      const receivedMessage = JSON.parse(message.body);
      const isMyMessage = receivedMessage.senderId === parseInt(userId);

      const newMsg = {
        ...receivedMessage,
        sender: isMyMessage ? 'me' : 'other',
        timestamp: new Date(receivedMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: isMyMessage ? receivedMessage.read : false
      };

      setMessages(prev => [...prev, newMsg]);

      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    });

    // Subscription for read-status notifications
    const readStatusSubscription = chatStompClient.subscribe(`/user/queue/read-status`, (message) => {
      const readUpdate = JSON.parse(message.body);
      setMessages(prev =>
        prev.map(m =>
          m.id === readUpdate.id ? { ...m, read: true } : m
        )
      );
    });

    return () => {
      messageSubscription.unsubscribe();
      readStatusSubscription.unsubscribe();
    };
  }, [chatStompClient, selectedUser, userId]);

  // Send read update via WebSocket for each unread message from the other user
  useEffect(() => {
    if (!selectedUser || !chatStompClient) return;
  
    messages.forEach((msg) => {
      // We only want to read "other" messages that are not yet read
      // and we haven't already triggered a read event for.
      if (msg.sender === "other" && !msg.read && msg.id && !readMessagesRef.current.has(msg.id)) {
        // Send read event once
        chatStompClient.send('/app/read', {}, JSON.stringify({ id: msg.id }));
        
        // Add to the set so we don't re-send next time
        readMessagesRef.current.add(msg.id);
      }
    });
  }, [messages, selectedUser, chatStompClient]);

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
        // We'll let the context handle the actual update by refetching
        // But we can clear selected user if it was the deleted one
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser(null);
        }
        fetchRecentChats();
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
        // We'll let the context handle the actual update by refetching
        // But we can clear selected user if it was the deleted one
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser(null);
        }
        fetchRecentChats();
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
    // Mark chat as read in the context
    markChatAsRead(selectedUser.id);

    // Existing loading logic
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

      // Highlighting logic
      const firstUnreadIndex = orderedMessages.findIndex(msg => 
        msg.sender === 'other' && !msg.read
      );
      
      if (firstUnreadIndex !== -1) {
        setNewMessageMarker(firstUnreadIndex);
        const newHighlight = new Set();
        orderedMessages.forEach((msg, index) => {
          if (index >= firstUnreadIndex && msg.sender === 'other' && !msg.read) {
            newHighlight.add(msg.id);
          }
        });
        setHighlightedMessages(newHighlight);
        
        setTimeout(() => {
          setHighlightedMessages(new Set());
          setNewMessageMarker(null);
        }, 5000);
      }

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
    if (newMessage.trim() && chatStompClient && selectedUser) {
      const message = {
        senderId: parseInt(userId),
        receiverId: selectedUser.id,
        content: newMessage
      };
      chatStompClient.send('/app/chat', {}, JSON.stringify(message));
      setNewMessage('');
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);
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
        timestamp: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: msg.read || false
      };
    });
  };

  // Infinite scroll: load more messages
  const loadMoreMessages = async () => {
    if (!hasMore || loadingMoreRef.current || !selectedUser) return;
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

  function handleScroll() {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    
    // 1) If near the top => load older messages
    if (scrollTop < 100) {
      loadMoreMessages();
    }

    // If near bottom, mark "other" unread as read
    if (scrollTop + clientHeight >= scrollHeight - 20 && chatStompClient) {
      messages.forEach(msg => {
        if (msg.sender === 'other' && !msg.read && !readMessagesRef.current.has(msg.id)) {
          chatStompClient.send('/app/read', {}, JSON.stringify({ id: msg.id }));
          readMessagesRef.current.add(msg.id);
        }
      });
    }
  }

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
                  {user.unreadCount > 0 && (
                    <div className="unread-count-badge">{user.unreadCount + " new messages"}</div>
                  )}
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
                const isHighlighted = highlightedMessages.has(msg.id);
                const isLastReadMessage = index === lastReadIndex && msg.read;
                
                return (
                  <React.Fragment key={index}>
                    {newMessageMarker === index && (
                      <div className="new-messages-label">New messages ▼</div>
                    )}
                    <div className={`chat-page-message ${msg.sender} ${isHighlighted ? 'highlighted' : ''}`}>
                      {msg.sender === 'other' ? (
                        <>
                          <img
                            src={msg.senderProfilePic || '/default-profile.png'}
                            alt="Profile"
                            className="chat-page-message-profile-pic left"
                          />
                          <div className="chat-page-message-content">
                            <p>{msg.content}</p>
                            <span className="chat-page-timestamp">{msg.timestamp}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="delete-icon-container">
                            <FaTrash 
                              className="delete-message-icon" 
                              onClick={(e) => handleDeleteMessage(msg.id)} 
                            />
                          </div>
                          <div className="chat-page-message-content">
                            <p>{msg.content}</p>
                            <span className="chat-page-timestamp">{msg.timestamp}</span>
                            {isLastReadMessage && (
                              <span className="seen-label">Seen</span>
                            )}
                          </div>
                          <img
                            src={profilePic || '/default-profile.png'}
                            alt="My Profile"
                            className="chat-page-message-profile-pic right"
                          />
                        </>
                      )}
                    </div>
                  </React.Fragment>
                );
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