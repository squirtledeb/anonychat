import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import ChatBox from './components/ChatBox';
import RestrictionPage from './components/RestrictionPage';

// App states: idle, connecting, searching, chatting, disconnected, backend_error, restricted
const STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  SEARCHING: 'searching',
  CHATTING: 'chatting',
  DISCONNECTED: 'disconnected',
  BACKEND_ERROR: 'backend_error',
  RESTRICTED: 'restricted'
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [onlineStats, setOnlineStats] = useState({
    onlineUsers: 0,
    waitingUsers: 0,
    activeChats: 0
  });
  const socketRef = useRef(null);

  // Generate or retrieve userId from localStorage
  useEffect(() => {
    let storedUserId = localStorage.getItem('chatUserId');
    if (!storedUserId) {
      storedUserId = generateUUID();
      localStorage.setItem('chatUserId', storedUserId);
    }
    setUserId(storedUserId);
    
    // Check IP access on app load
    checkIPAccess();
  }, []);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('chatTheme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('chatTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Initialize socket connection
  const initializeSocket = () => {
    if (!userId || isConnecting) return;

    setIsConnecting(true);
    
    try {
      // Connect to the same domain the app is running on
      const backendUrl = window.location.origin;
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
        setIsConnecting(false);
      });

      newSocket.on('paired', ({ partnerId }) => {
        console.log('Received paired event with partnerId:', partnerId);
        setState(STATES.CHATTING);
        setMessages([]); // Clear previous messages
        setIsConnecting(false);
      });

      newSocket.on('message', ({ text, from }) => {
        console.log('Received message:', { text, from });
        setMessages((prevMessages) => [...prevMessages, { text, from, timestamp: Date.now() }]);
      });

      newSocket.on('stranger_left', () => {
        console.log('Received stranger_left event');
        setState(STATES.DISCONNECTED);
        setMessages([]);
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
        }
        setIsConnecting(false);
      });

      // Handle real-time online stats
      newSocket.on('online_stats', (stats) => {
        console.log('Received online stats:', stats);
        setOnlineStats(stats);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setState(STATES.BACKEND_ERROR);
        setIsConnecting(false);
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
        }
      });

      newSocket.on('error', (err) => {
        console.error('Socket error:', err);
        setState(STATES.BACKEND_ERROR);
        setIsConnecting(false);
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io client disconnect') {
          // User initiated disconnect, or stranger left
        } else {
          // Server disconnected or network error
          if (state !== STATES.DISCONNECTED && state !== STATES.BACKEND_ERROR) {
            setState(STATES.DISCONNECTED);
          }
        }
        setIsConnecting(false);
        socketRef.current = null;
        setSocket(null);
      });

    } catch (error) {
      console.error('Error initializing socket:', error);
      setState(STATES.BACKEND_ERROR);
      setIsConnecting(false);
    }
  };

  // Check if user has access from college WiFi
  const checkIPAccess = async () => {
    try {
      const response = await fetch('/health');
      if (response.status === 403) {
        console.log('Access denied - showing restriction page');
        setState(STATES.RESTRICTED);
        return;
      }
      // If we get here, access is allowed
      console.log('Access granted from college WiFi');
      
      // Fetch initial online stats
      fetchOnlineStats();
    } catch (error) {
      console.error('Error checking IP access:', error);
      // If there's an error, we'll assume it's a network issue, not restriction
    }
  };

  // Fetch current online stats
  const fetchOnlineStats = async () => {
    try {
      const response = await fetch('/api/stats');
      console.log('Stats response status:', response.status);
      console.log('Stats response headers:', response.headers);
      
      if (response.ok) {
        const text = await response.text(); // Get raw response first
        console.log('Stats response text:', text);
        
        try {
          const stats = JSON.parse(text);
          console.log('Parsed stats:', stats);
          setOnlineStats(stats);
        } catch (parseError) {
          console.error('Failed to parse stats JSON:', parseError);
          console.log('Raw response was:', text);
          // Set default stats if JSON parsing fails
          setOnlineStats({
            onlineUsers: 1,
            waitingUsers: 1,
            activeChats: 0
          });
        }
      } else {
        console.log('Stats endpoint returned error status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        // Set default stats if API fails
        setOnlineStats({
          onlineUsers: 1, // At least the current user
          waitingUsers: 1, // Current user is waiting
          activeChats: 0
        });
      }
    } catch (error) {
      console.error('Error fetching online stats:', error);
      // Set default stats on error
      setOnlineStats({
        onlineUsers: 1,
        waitingUsers: 1,
        activeChats: 0
      });
    }
  };

  // Also check IP access when the page loads (for direct navigation)
  useEffect(() => {
    // Check if we're already restricted
    if (state !== STATES.RESTRICTED) {
      checkIPAccess();
    }
  }, []);

  const handleStartChat = () => {
    setState(STATES.CONNECTING); // Set state to CONNECTING when button is clicked
    initializeSocket();
  };

  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
    }
    setState(STATES.IDLE);
    setMessages([]);
  };

  const handleSendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit('message', { text, userId });
      setMessages((prevMessages) => [...prevMessages, { text, from: 'me', timestamp: Date.now() }]);
    }
  };

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'
    }`}>
      {/* Show restriction page if access is denied */}
      {state === STATES.RESTRICTED ? (
        <RestrictionPage isDarkMode={isDarkMode} />
      ) : (
        <>
          {/* Header with Theme Toggle */}
          <header className={`sticky top-0 z-50 backdrop-blur-lg border-b transition-all duration-500 ${
            isDarkMode 
              ? 'bg-gray-900/80 border-gray-700' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isDarkMode ? 'bg-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}>
                    <span className="text-white text-xl">💬</span>
                  </div>
                  <div>
                    <h1 className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Anonymous Chat
                    </h1>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Connect with strangers worldwide
                    </p>
                  </div>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ☀️
                    </span>
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isDarkMode 
                          ? 'bg-purple-600 focus:ring-purple-500' 
                          : 'bg-gray-200 focus:ring-gray-500'
                      } ${isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                          isDarkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      🌙
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
            {state === STATES.IDLE && (
              <div className="w-full max-w-4xl mx-auto px-4 text-center">
                {/* Hero Section */}
                <div className="mb-16 animate-fade-in-down">
                  <h2 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 leading-tight ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Start Chatting with
                    <span className={`block mt-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent`}>
                      Random Strangers
                    </span>
                  </h2>
                  <p className={`text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Experience the thrill of anonymous conversations. Connect with people from around the world, 
                    share thoughts, and make new connections - all without revealing your identity.
                  </p>
                </div>

                {/* CTA Button */}
                <div className="mb-16 animate-fade-in-up">
                  <button
                    onClick={handleStartChat}
                    disabled={isConnecting}
                    className={`group relative inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-bold rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105 hover-lift ${
                      isConnecting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <span className="relative z-10 flex items-center space-x-3 text-white">
                      {isConnecting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <span>Start Chatting Now</span>
                        </>
                      )}
                    </span>
                    {!isConnecting && (
                      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  <div className={`flex items-center justify-center space-x-3 p-4 rounded-xl hover-lift ${
                    isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'
                  } backdrop-blur-sm border ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  } animate-fade-in-left`}>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Live connections</span>
                  </div>
                  <div className={`flex items-center justify-center space-x-3 p-4 rounded-xl hover-lift ${
                    isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'
                  } backdrop-blur-sm border ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  } animate-fade-in-up`}>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Secure & private</span>
                  </div>
                  <div className={`flex items-center justify-center space-x-3 p-4 rounded-xl hover-lift ${
                    isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'
                  } backdrop-blur-sm border ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  } animate-fade-in-right`}>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>No registration</span>
                  </div>
                </div>
              </div>
            )}

            {state !== STATES.IDLE && (
              <div className="w-full max-w-4xl mx-auto">
                <div className={`rounded-2xl shadow-2xl p-6 sm:p-8 ${
                  isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'
                } backdrop-blur-lg border ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  {state === STATES.CONNECTING && (
                    <div className="text-center py-16">
                      <div className={`text-2xl font-semibold mb-6 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>Connecting to server...</div>
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                      </div>
                    </div>
                  )}
                  {state === STATES.SEARCHING && (
                    <div className="text-center py-16">
                      <div className={`text-2xl font-semibold mb-6 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>Looking for someone to chat with...</div>
                      
                      {/* Real-time Stats */}
                      <div className={`mb-8 p-6 rounded-2xl ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                      } backdrop-blur-sm border ${
                        isDarkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>Live Activity</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`}>
                              {onlineStats.onlineUsers || 0}
                            </div>
                            <div className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Online Now</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              {onlineStats.waitingUsers || 0}
                            </div>
                            <div className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Looking for Chat</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                              {onlineStats.activeChats || 0}
                            </div>
                            <div className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Active Chats</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                      </div>
                      
                      {/* Encouraging Message */}
                      <div className={`mt-6 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {onlineStats.waitingUsers > 1 
                          ? `You're not alone! ${onlineStats.waitingUsers - 1} other people are also looking for a chat.`
                          : "You're the first one here! More people will join soon."
                        }
                      </div>
                    </div>
                  )}
                  {state === STATES.CHATTING && (
                    <ChatBox 
                      messages={messages} 
                      onSendMessage={handleSendMessage} 
                      onDisconnect={handleDisconnect}
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {state === STATES.DISCONNECTED && (
                    <div className="text-center py-16">
                      <div className={`text-2xl font-semibold mb-6 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>Stranger left the chat.</div>
                      <button
                        onClick={handleStartChat}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Start New Chat
                      </button>
                    </div>
                  )}
                  {state === STATES.BACKEND_ERROR && (
                    <div className="text-center py-16">
                      <div className={`text-2xl font-semibold mb-6 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>Could not connect to the backend server.</div>
                      <p className={`text-lg mb-8 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Please ensure the backend is running and accessible.</p>
                      <button
                        onClick={handleStartChat}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Retry Connection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
