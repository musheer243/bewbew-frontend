import React, { useState } from 'react';
import { IoIosSend } from 'react-icons/io';
import '../../styles/AIChatting.css';
import { API_BASE_URL } from "../../config";

const AIChatting = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  const handleSendMessage = async () => {
  if (!message.trim()) return;

  const userMessage = { sender: 'user', text: message };
  setChat((prevChat) => [...prevChat, userMessage]);

  try {
    const token = localStorage.getItem("jwtToken"); // Retrieve JWT token from local storage
    const url = `${API_BASE_URL}/api/ai/generateStream?message=${encodeURIComponent(message)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

      // Update the chat dynamically as chunks arrive
      setChat((prevChat) => {
        const lastMessage = prevChat[prevChat.length - 1];
        if (lastMessage && lastMessage.sender === "ai") {
          return [...prevChat.slice(0, -1), { sender: "ai", text: aiResponse }];
        } else {
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
  }

  setMessage("");
};

  

  return (
    <div className="chat-container">
      <div className="chat-box">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="chat-input"
        />
        <button onClick={handleSendMessage} className="send-button">
          <IoIosSend />
        </button>
      </div>
    </div>
  );
};

export default AIChatting;
