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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">💬</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Anonymous Chat
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Connect with strangers worldwide
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <StatusBar state={state} />
        
        {state === STATES.IDLE && (
          <div className="text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <h2 className="text-5xl font-bold text-gray-800 mb-6">
                Start Chatting with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Random Strangers
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Experience the thrill of anonymous conversations. Connect with people from around the world, 
                share thoughts, and make new connections - all without revealing your identity.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">100% Anonymous</h3>
                <p className="text-gray-600">No personal information required. Your privacy is guaranteed.</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Global Connections</h3>
                <p className="text-gray-600">Meet people from different countries and cultures worldwide.</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Instant Pairing</h3>
                <p className="text-gray-600">Get matched with strangers in seconds. No waiting, no delays.</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-8">
              <button
                onClick={startChat}
                className="group relative inline-flex items-center justify-center px-12 py-4 text-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <span>🚀</span>
                  <span>Start Chatting Now</span>
                  <span>💬</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live connections</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Secure & private</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>No registration</span>
              </div>
            </div>
          </div>
        )}

        {state === STATES.SEARCHING && (
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDelay: '0.5s'}}></div>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Looking for someone...</h3>
            <p className="text-xl text-gray-600 mb-6">We're finding you the perfect chat partner</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
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
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 text-red-700 px-8 py-6 rounded-2xl mb-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-2xl font-semibold mb-2">Stranger left the chat</h3>
              <p className="text-red-600">Don't worry, there are plenty more people to meet!</p>
            </div>
            <button
              onClick={startChat}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🚀 Start New Chat
            </button>
          </div>
        )}

        {state === STATES.BACKEND_ERROR && (
          <div className="text-center py-16">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-8 py-6 rounded-2xl mb-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-semibold mb-2">Connection Issue</h3>
              <p className="text-yellow-600">Unable to connect to the chat server. Please try again later.</p>
            </div>
            <button
              onClick={startChat}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🔄 Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
