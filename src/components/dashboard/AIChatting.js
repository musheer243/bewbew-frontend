import React, { useState, useEffect, useRef } from 'react';
import { IoIosSend, IoIosArrowBack } from 'react-icons/io';
import { Link } from 'react-router-dom';
import '../../styles/AIChatting.css';
import { API_BASE_URL } from "../../config";

const AIChatting = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedProfile, setCachedProfile] = useState(null);
  const chatBoxRef = useRef(null);

  // Retrieve cached profile from localStorage
  useEffect(() => {
    const profile = localStorage.getItem("cachedProfile");
    if (profile) {
      try {
        const parsedProfile = JSON.parse(profile);
        setCachedProfile(parsedProfile);
      } catch (error) {
        console.error("Error parsing cached profile:", error);
      }
    }
  }, []);

  // Always scroll to bottom whenever chat changes
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    const currentMessage = message;

    // Add the user's message to the chat
    setChat((prevChat) => [
      ...prevChat,
      { sender: 'user', text: currentMessage }
    ]);
    setMessage('');

    try {
      const token = localStorage.getItem("jwtToken");
      const url = `${API_BASE_URL}/api/ai/generateStream?message=${encodeURIComponent(currentMessage)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to communicate with AI.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        aiResponse += decoder.decode(value, { stream: true });

        // Update the AI's message chunk by chunk
        setChat((prevChat) => {
          const lastMsg = prevChat[prevChat.length - 1];
          if (lastMsg && lastMsg.sender === "ai") {
            // If the last message is already from AI, update that text
            return [
              ...prevChat.slice(0, -1),
              { sender: "ai", text: aiResponse }
            ];
          } else {
            // Otherwise, add a new AI message
            return [...prevChat, { sender: "ai", text: aiResponse }];
          }
        });
      }
    } catch (error) {
      console.error("Error communicating with AI:", error);
      setChat((prevChat) => [
        ...prevChat,
        { sender: "ai", text: "Failed to communicate with AI." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="AIChatting-container">
      {/* Header pinned at top */}
      <div className="AIChatting-header">
        <Link to="/dashboard" className="AIChatting-back-arrow">
          <IoIosArrowBack />
        </Link>
        <div className="AIChatting-header-profile">
          <img
            src="/assets/ai-image.webp"
            alt="AI Profile"
            className="AIChatting-header-img"
          />
        </div>
        <div className="AIChatting-header-name">The Knowledgable</div>
      </div>

      {/* Main chat area (scrollable) + input pinned at bottom */}
      <div className="AIChatting-chat-container">
        {/* The scrollable messages box */}
        <div className="AIChatting-chat-box" ref={chatBoxRef}>
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`AIChatting-message ${
                msg.sender === 'user'
                  ? 'AIChatting-user-message'
                  : 'AIChatting-ai-message'
              }`}
            >
              {/* If AI, show AI pic on the left */}
              {msg.sender === 'ai' && (
                <img
                  src="/assets/ai-image.webp"
                  alt="AI"
                  className="AIChatting-message-profile"
                />
              )}

              {/* The bubble text */}
              <div className="AIChatting-message-text">{msg.text}</div>

              {/* If user, show user's pic on the right */}
              {msg.sender === 'user' && cachedProfile && (
                <img
                  src={cachedProfile.profilepic}
                  alt={cachedProfile.username}
                  className="AIChatting-message-profile"
                />
              )}
            </div>
          ))}
        </div>

        {/* Input pinned at bottom */}
        <div className="AIChatting-input-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="AIChatting-chat-input"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="AIChatting-send-button"
            disabled={isLoading}
          >
            <IoIosSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatting;
