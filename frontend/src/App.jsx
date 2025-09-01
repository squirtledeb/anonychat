import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import StatusBar from './components/StatusBar';
import ChatBox from './components/ChatBox';

// App states: idle, searching, chatting, disconnected
const STATES = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  CHATTING: 'chatting',
  DISCONNECTED: 'disconnected',
  BACKEND_ERROR: 'backend_error'
};

// Generate a simple UUID (more compatible than crypto.randomUUID)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

function App() {
  const [state, setState] = useState(STATES.IDLE);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  // Generate or retrieve userId from localStorage
  useEffect(() => {
    let storedUserId = localStorage.getItem('chatUserId');
    if (!storedUserId) {
      storedUserId = generateUUID();
      localStorage.setItem('chatUserId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;

    console.log('Connecting to socket with userId:', userId);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      console.log('Connecting to backend at:', backendUrl);
      const newSocket = io(backendUrl);
      socketRef.current = newSocket;
      setSocket(newSocket);

      // Join the chat with userId
      newSocket.emit('join', { userId });

      // Socket event handlers
      newSocket.on('waiting', () => {
        console.log('Received waiting event');
        setState(STATES.SEARCHING);
      });

      newSocket.on('paired', ({ partnerId }) => {
        console.log('Received paired event with partnerId:', partnerId);
        setState(STATES.CHATTING);
        setMessages([]); // Clear previous messages
      });

      newSocket.on('message', ({ text, from }) => {
        console.log('Received message:', text, 'from:', from);
        setMessages(prev => [...prev, { text, from, timestamp: Date.now() }]);
      });

      newSocket.on('stranger_left', () => {
        console.log('Received stranger_left event');
        setState(STATES.DISCONNECTED);
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        // If backend is not running, show a helpful message
        setState(STATES.BACKEND_ERROR);
      });

      return () => {
        newSocket.close();
      };
    } catch (error) {
      console.error('Error setting up socket:', error);
    }
  }, [userId]);

  // Start new chat
  const startChat = () => {
    if (socket) {
      socket.emit('join', { userId });
      setState(STATES.SEARCHING);
      setMessages([]);
    }
  };

  // Send message
  const sendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit('message', { text, userId });
      setMessages(prev => [...prev, { text, from: 'me', timestamp: Date.now() }]);
    }
  };

  // Disconnect and return to idle
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
    }
    setState(STATES.IDLE);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-800">Anonymous Chat</h1>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <StatusBar state={state} />
        
        {state === STATES.IDLE && (
          <div className="text-center py-12">
            <button
              onClick={startChat}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Start Chat
            </button>
            <p className="text-gray-600 mt-4">Click to find a random stranger to chat with</p>
          </div>
        )}

        {state === STATES.SEARCHING && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-lg">Looking for someone...</p>
          </div>
        )}

        {state === STATES.CHATTING && (
          <ChatBox 
            messages={messages} 
            onSendMessage={sendMessage}
            onDisconnect={disconnect}
          />
        )}

        {state === STATES.DISCONNECTED && (
          <div className="text-center py-12">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-semibold">Stranger left the chat</p>
            </div>
            <button
              onClick={startChat}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Start New Chat
            </button>
          </div>
        )}

        {state === STATES.BACKEND_ERROR && (
          <div className="text-center py-12">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p className="font-semibold">Backend server is not running. Please start it.</p>
            </div>
            <button
              onClick={startChat}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
