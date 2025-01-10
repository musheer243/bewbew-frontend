import React, { useState } from 'react';
import axios from 'axios';

const AIChatting = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const handleSendMessage = async () => {
    try {
      const res = await axios.get(
        `http://34.227.206.93:9090/api/ai/generate?message=${encodeURIComponent(message)}`
      );
      setResponse(res.data.generation || 'No response from AI');
    } catch (error) {
      console.error('Error communicating with AI:', error);
      setResponse('Failed to communicate with AI.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ marginBottom: '20px', color: '#007BFF' }}>AI Chatting</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here..."
        style={{
          width: '100%',
          height: '100px',
          marginBottom: '10px',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px',
        }}
      />
      <button
        onClick={handleSendMessage}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007BFF',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Send
      </button>
      {response && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <strong>AI Response:</strong>
          <p style={{ marginTop: '10px' }}>{response}</p>
        </div>
      )}
    </div>
  );
};

export default AIChatting;
