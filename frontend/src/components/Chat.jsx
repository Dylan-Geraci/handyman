import { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function Chat() {
  const { taskId } = useParams();
  const { user, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/messages/${taskId}`);
        setMessages(response.data);
      } catch (err) {
        setError("Could not load messages. You may not have access to this chat.");
      }
    };

    if (token) {
      fetchMessages();
    }
  }, [taskId, token]);

  useEffect(() => {
    if (!token) {
      setConnectionStatus('Authentication token not found.');
      return;
    };

    const wsUrl = `ws://localhost:8000/ws/${taskId}/${token}`;
    ws.current = new WebSocket(wsUrl);
    setConnectionStatus('Connecting...');

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus('Connected');
    };
    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus('Disconnected. Please refresh the page.');
    };
    ws.current.onerror = (event) => {
      console.error("WebSocket error:", event);
      setConnectionStatus('Connection error.');
    };

    ws.current.onmessage = (event) => {
      try {
        const receivedMessage = JSON.parse(event.data);
        if (receivedMessage.content) {
            setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        }
      } catch (e) {
        console.error("Failed to parse message:", event.data);
      }
    };

    // Cleanup function to close the socket when the component unmounts
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [taskId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(newMessage);
      setNewMessage('');
    } else {
        setError("Cannot send message. Connection is not open.");
    }
  };
  
  const isConnected = connectionStatus === 'Connected';

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md mt-10 flex flex-col" style={{height: '70vh'}}>
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Chat for Task #{taskId.slice(-6)}</h2>
        <span className={`text-xs font-bold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>{connectionStatus}</span>
      </div>
      <div className="p-4 flex-grow overflow-y-auto bg-gray-50">
        {error && <p className="text-red-500 text-center">{error}</p>}
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg._id} 
              className={`flex items-end ${msg.sender_username === user?.username ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                  msg.sender_username === user?.username
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="font-bold text-sm">{msg.sender_username}</p>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t bg-gray-100">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Waiting for connection..."}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={!isConnected}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;