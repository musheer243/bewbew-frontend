import React, { useState, useEffect } from 'react';
import { IoIosSend } from 'react-icons/io';
import '../../styles/AIChatting.css';
import { API_BASE_URL } from "../../config";

const AIChatting = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedProfile, setCachedProfile] = useState(null);

  // Retrieve and parse the cached profile from localStorage
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

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    // Add the user's message to the chat
    const userMessage = { sender: 'user', text: message };
    setChat((prevChat) => [...prevChat, userMessage]);
    setMessage('');


    try {
      const token = localStorage.getItem("jwtToken");
      const url = `${API_BASE_URL}/api/ai/generateStream?message=${encodeURIComponent(message)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
          const lastMessage = prevChat[prevChat.length - 1];
          if (lastMessage && lastMessage.sender === "ai") {
            return [...prevChat.slice(0, -1), { sender: "ai", text: aiResponse }];
          } else {
            return [...prevChat, { sender: "ai", text: aiResponse }];
          }
        });

        // Once we start receiving data, remove the "AI is typing..." message
        setIsLoading(false);
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

  // Send message on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="AIChatting-container">
      {/* Chat Header */}
      <div className="AIChatting-header">
        <div className="AIChatting-header-profile">
          <img
            src="bewbew/public/ai image.webp"
            alt="AI Profile"
            className="AIChatting-header-img"
          />
        </div>
        <div className="AIChatting-header-name">The Knowledgable</div>
      </div>

      {/* Chat Box */}
      <div className="AIChatting-chat-container">
        <div className="AIChatting-chat-box">
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`AIChatting-message ${
                msg.sender === 'user'
                  ? 'AIChatting-user-message'
                  : 'AIChatting-ai-message'
              }`}
            >
              {msg.sender === 'ai' && (
                <img
                  src="bewbew/public/ai image.webp"
                  alt="AI"
                  className="AIChatting-message-profile"
                />
              )}
              <div className="AIChatting-message-text">{msg.text}</div>
              {msg.sender === 'user' && cachedProfile && (
                <img
                  src={cachedProfile.profilepic}
                  alt={cachedProfile.username}
                  className="AIChatting-message-profile"
                />
              )}
            </div>
          ))}
          {isLoading && (
            <div className="AIChatting-message AIChatting-ai-message">
              <img
                src="bewbew/public/ai image.webp"
                alt="AI"
                className="AIChatting-message-profile"
              />
              <div className="AIChatting-message-text">AI is typing...</div>
            </div>
          )}
        </div>

        {/* Input Field */}
        <div className="AIChatting-input-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
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
