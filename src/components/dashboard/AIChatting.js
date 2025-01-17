import React, { useState } from 'react';
import axios from 'axios';
import { IoIosSend } from 'react-icons/io';
import '../../styles/AIChatting.css';

const AIChatting = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChat((prevChat) => [...prevChat, userMessage]);

    try {
      const res = await axios.get(
        `http://3.225.10.130:9090/api/ai/generate?message=${encodeURIComponent(message)}`
      );
      const aiMessage = { sender: 'ai', text: res.data.generation || 'No response from AI' };
      setChat((prevChat) => [...prevChat, aiMessage]);
    } catch (error) {
      console.error('Error communicating with AI:', error);
      const errorMessage = { sender: 'ai', text: 'Failed to communicate with AI.' };
      setChat((prevChat) => [...prevChat, errorMessage]);
    }

    setMessage('');
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
