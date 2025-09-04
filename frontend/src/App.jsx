import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import ChatBox from './components/ChatBox';
import RestrictionPage from './components/RestrictionPage';

// App states: idle, connecting, searching, chatting, disconnected, backend_error, restricted
const STATES = {
  IDLE: 'idle',
  WELCOME: 'welcome',
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

// Main App Content Component
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState(STATES.IDLE);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    const saved = localStorage.getItem('hasSeenWelcome');
    return saved ? JSON.parse(saved) : false;
  });
  const [onlineStats, setOnlineStats] = useState({
    onlineUsers: 0,
    waitingUsers: 0,
    activeChats: 0
  });
  const [sharedInterests, setSharedInterests] = useState([]);
  const socketRef = useRef(null);
  const [interestInput, setInterestInput] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);

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

  // Sync URL with current state
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Map URL paths to states
    if (currentPath === '/' || currentPath === '/home') {
      if (state !== STATES.IDLE && state !== STATES.RESTRICTED) {
        setState(STATES.IDLE);
      }
    } else if (currentPath === '/welcome') {
      if (state !== STATES.WELCOME) {
        setState(STATES.WELCOME);
      }
    } else if (currentPath === '/connecting') {
      if (state !== STATES.CONNECTING) {
        setState(STATES.CONNECTING);
      }
    } else if (currentPath === '/searching') {
      if (state !== STATES.SEARCHING) {
        setState(STATES.SEARCHING);
      }
    } else if (currentPath === '/chat') {
      if (state !== STATES.CHATTING) {
        setState(STATES.CHATTING);
      }
    } else if (currentPath === '/disconnected') {
      if (state !== STATES.DISCONNECTED) {
        setState(STATES.DISCONNECTED);
      }
    } else if (currentPath === '/error') {
      if (state !== STATES.BACKEND_ERROR) {
        setState(STATES.BACKEND_ERROR);
      }
    } else if (currentPath === '/restricted') {
      if (state !== STATES.RESTRICTED) {
        setState(STATES.RESTRICTED);
      }
    }
  }, [location.pathname]);

  // Update URL when state changes
  useEffect(() => {
    const currentPath = location.pathname;
    let targetPath = '/';
    
    switch (state) {
      case STATES.IDLE:
        targetPath = '/';
        break;
      case STATES.WELCOME:
        targetPath = '/welcome';
        break;
      case STATES.CONNECTING:
        targetPath = '/connecting';
        break;
      case STATES.SEARCHING:
        targetPath = '/searching';
        break;
      case STATES.CHATTING:
        targetPath = '/chat';
        break;
      case STATES.DISCONNECTED:
        targetPath = '/disconnected';
        break;
      case STATES.BACKEND_ERROR:
        targetPath = '/error';
        break;
      case STATES.RESTRICTED:
        targetPath = '/restricted';
        break;
      default:
        targetPath = '/';
    }
    
    if (currentPath !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [state, navigate, location.pathname]);

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
      newSocket.emit('join', { userId, interests: selectedInterests });

      // Socket event handlers
      newSocket.on('waiting', () => {
        console.log('Received waiting event');
        setState(STATES.SEARCHING);
        setIsConnecting(false);
      });

      newSocket.on('paired', ({ partnerId, sharedInterests: interests }) => {
        console.log('Received paired event with partnerId:', partnerId, 'and shared interests:', interests);
        setState(STATES.CHATTING);
        setMessages([]); // Clear previous messages
        setSharedInterests(interests || []); // Store shared interests
        
        // Add shared interests message to chat
        if (interests && interests.length > 0) {
          const interestsText = interests.join(', ');
          setMessages([{ 
            text: `You both like: ${interestsText}`, 
            from: 'system', 
            timestamp: Date.now() 
          }]);
        }
        
        setIsConnecting(false);
      });

      newSocket.on('message', ({ text, from }) => {
        console.log('Received message:', { text, from });
        setMessages((prevMessages) => [...prevMessages, { text, from, timestamp: Date.now() }]);
      });

      // Handle typing indicators
      newSocket.on('stranger_typing', () => {
        console.log('Stranger is typing');
        setIsStrangerTyping(true);
      });

      newSocket.on('stranger_stopped_typing', () => {
        console.log('Stranger stopped typing');
        setIsStrangerTyping(false);
      });

      newSocket.on('stranger_left', () => {
        console.log('Received stranger_left event');
        setState(STATES.DISCONNECTED);
        setMessages([]);
        setSharedInterests([]); // Clear shared interests
        setIsStrangerTyping(false); // Clear typing indicator
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
            setState(STATES.BACKEND_ERROR);
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
      // Set default stats and continue
      setOnlineStats({
        onlineUsers: 1,
        waitingUsers: 1,
        activeChats: 0
      });
    }
  };

  // Fetch current online stats
  const fetchOnlineStats = async () => {
    try {
      const response = await fetch('/api/stats');
      console.log('Stats response status:', response.status);
      console.log('Stats response headers:', response.headers);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        // Check if response is actually JSON
        if (contentType && contentType.includes('application/json')) {
        try {
            const stats = await response.json();
          console.log('Parsed stats:', stats);
          setOnlineStats(stats);
        } catch (parseError) {
          console.error('Failed to parse stats JSON:', parseError);
          // Set default stats if JSON parsing fails
            setOnlineStats({
              onlineUsers: 1,
              waitingUsers: 1,
              activeChats: 0
            });
          }
        } else {
          console.log('Response is not JSON, content-type:', contentType);
          // Set default stats if response is not JSON
          setOnlineStats({
            onlineUsers: 1,
            waitingUsers: 1,
            activeChats: 0
          });
        }
      } else {
        console.log('Stats endpoint returned error status:', response.status);
        // Set default stats if API fails
        setOnlineStats({
          onlineUsers: 1,
          waitingUsers: 1,
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
    if (hasSeenWelcome) {
      // Skip welcome screen, go directly to connecting
      setState(STATES.CONNECTING);
      setSharedInterests([]);
      initializeSocket();
    } else {
      // Show welcome screen first time
      setState(STATES.WELCOME);
      setSharedInterests([]);
    }
  };

  const handleStartConnection = () => {
    // Mark that user has seen the welcome screen
    setHasSeenWelcome(true);
    localStorage.setItem('hasSeenWelcome', 'true');
    
    setState(STATES.CONNECTING); // Set state to CONNECTING when button is clicked
    setSharedInterests([]); // Clear previous shared interests
    initializeSocket();
  };

  const handleNewChat = () => {
    setState(STATES.CONNECTING); // Start a new chat connection
    setSharedInterests([]); // Clear previous shared interests
    setMessages([]); // Clear previous messages
    setIsStrangerTyping(false); // Clear typing indicator
    initializeSocket();
  };

  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
    }
    setState(STATES.IDLE);
    setMessages([]);
    setSharedInterests([]); // Clear shared interests
    setIsStrangerTyping(false); // Clear typing indicator
  };

  const handleSendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit('message', { text, userId });
      setMessages((prevMessages) => [...prevMessages, { text, from: 'me', timestamp: Date.now() }]);
    }
  };

  const addInterest = () => {
    const trimmedInput = interestInput.trim();
    if (trimmedInput && !selectedInterests.some(interest => interest.toLowerCase() === trimmedInput.toLowerCase())) {
      setSelectedInterests([...selectedInterests, trimmedInput]);
      setInterestInput('');
    }
  };

  const removeInterest = (index) => {
    setSelectedInterests(selectedInterests.filter((_, i) => i !== index));
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
    <div className={`h-screen w-full transition-all duration-700 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-gray-900'
    }`}>
      {/* Show restriction page if access is denied */}
      {state === STATES.RESTRICTED ? (
        <RestrictionPage isDarkMode={isDarkMode} />
      ) : (
        <>
          {/* Header with Theme Toggle */}
          <header className={`sticky top-0 z-50 backdrop-blur-2xl border-b transition-all duration-700 w-full ${
            isDarkMode 
              ? 'bg-black/95 border-gray-800' 
              : 'bg-white/80 border-slate-200/50 shadow-2xl shadow-slate-900/10'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                {/* Logo */}
                <button 
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2 sm:space-x-4 hover:opacity-80 transition-opacity duration-300"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                    isDarkMode 
                      ? 'bg-white shadow-2xl shadow-white/20 hover:shadow-white/40' 
                      : 'bg-slate-900 shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/40'
                  } hover:scale-110`}>
                    <span className={`text-xl sm:text-2xl ${isDarkMode ? 'text-slate-900' : 'text-white'}`}>💬</span>
                  </div>
                  <div>
                    <h1 className={`text-lg sm:text-2xl font-black tracking-tight ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      Krizz
                    </h1>
                    <p className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Campus Connections
                    </p>
                  </div>
                </button>

                {/* Theme Toggle */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className={`text-sm sm:text-lg transition-all duration-300 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      ☀️
                    </span>
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`relative inline-flex h-6 w-12 sm:h-7 sm:w-14 items-center rounded-full transition-all duration-500 focus:outline-none focus:ring-4 ${
                        isDarkMode 
                          ? 'bg-white focus:ring-white/30 shadow-2xl shadow-white/20' 
                          : 'bg-slate-200 focus:ring-slate-400/30 shadow-2xl shadow-slate-900/10'
                      } ${isDarkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full transition-all duration-500 ${
                          isDarkMode ? 'translate-x-6 sm:translate-x-8 bg-slate-900' : 'translate-x-1 bg-white'
                        }`}
                      />
                    </button>
                    <span className={`text-sm sm:text-lg transition-all duration-300 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      🌙
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 flex items-center justify-center w-full ${
            state === STATES.CHATTING ? 'h-full px-0' : 
            state === STATES.WELCOME ? 'h-full px-0' : 'h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] px-4 sm:px-6'
          }`}>
            {state === STATES.IDLE && (
              <div className="w-full max-w-4xl mx-auto text-center">
                {/* Main Title Section */}
                <div className="mb-16 animate-fade-in-down">
                  <p className={`text-2xl sm:text-3xl font-medium max-w-3xl mx-auto leading-relaxed ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Connect with fellow students through shared interests and meaningful conversations
                  </p>
                </div>

                {/* Interest Setup Card */}
                <div className={`w-full max-w-3xl mx-auto p-12 rounded-4xl transition-all duration-700 ${
                  isDarkMode
                    ? 'bg-black border border-gray-700 shadow-2xl shadow-white/5'
                    : 'bg-white/80 border border-slate-200/50 shadow-2xl shadow-slate-900/20 backdrop-blur-2xl'
                }`}>
                  <h2 className={`text-4xl font-black text-center mb-10 tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    What interests you?
                  </h2>
                  
                  {/* Interest Input */}
                  <div className="flex space-x-4 mb-8">
                    <div className="flex-1 relative">
                      <div className={`px-8 py-5 rounded-2xl border-2 transition-all duration-300 focus-within:ring-4 ${
                        isDarkMode
                          ? 'bg-black border-gray-700 text-white focus-within:border-white focus-within:ring-white/20 shadow-lg'
                          : 'bg-white border-slate-200 text-slate-900 focus-within:border-slate-900/50 focus-within:ring-slate-900/20 shadow-lg'
                      }`}>
                        {/* Selected Interests as Tags */}
                        {selectedInterests.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {selectedInterests.map((interest, index) => (
                              <div
                                key={index}
                                className={`px-3 py-1 rounded-full flex items-center space-x-2 text-sm ${
                                  isDarkMode 
                                    ? 'bg-white text-black' 
                                    : 'bg-slate-900 text-white'
                                } font-medium`}
                              >
                                <span>{interest}</span>
                                <button
                                  onClick={() => removeInterest(index)}
                                  className="w-4 h-4 rounded-full hover:bg-black/10 transition-colors flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Input Field */}
                    <input
                      type="text"
                          placeholder="Add an interest (optional)"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                          className={`w-full bg-transparent border-none outline-none text-lg placeholder-gray-400 ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    />
                      </div>
                    </div>
                    <button
                      onClick={addInterest}
                      disabled={!interestInput.trim()}
                      className={`px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/20 hover:shadow-white/40 hover:scale-105'
                          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:scale-105'
                      }`}
                    >
                      Add
                    </button>
                  </div>

                  {/* Start Chat Button */}
                  <button
                    onClick={handleStartChat}
                    disabled={isConnecting}
                    className={`w-full py-6 px-8 rounded-3xl font-black text-2xl transition-all duration-500 ${
                      isConnecting
                        ? 'bg-slate-400 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/30 hover:shadow-white/50 hover:scale-105'
                          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-900/30 hover:shadow-slate-900/40 hover:scale-105'
                    }`}
                  >
                    {isConnecting ? 'Connecting...' : 'Start Chatting'}
                  </button>

                  {/* Development Mode - Test Different States */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-6 rounded-2xl border border-gray-600">
                      <h3 className="text-lg font-bold text-gray-300 mb-4 text-center">🧪 Dev Mode - Test States</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => navigate('/welcome')}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                        >
                          Test Welcome
                        </button>
                        <button
                          onClick={() => navigate('/connecting')}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                        >
                          Test Connecting
                        </button>
                        <button
                          onClick={() => navigate('/searching')}
                          className="px-4 py-2 rounded-xl bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition-colors"
                        >
                          Test Searching
                        </button>
                        <button
                          onClick={() => navigate('/chat')}
                          className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition-colors"
                        >
                          Test Chatting
                        </button>
                        <button
                          onClick={() => navigate('/disconnected')}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                        >
                          Test Disconnected
                        </button>
                        <button
                          onClick={() => navigate('/error')}
                          className="px-4 py-2 rounded-xl bg-red-800 text-white text-sm hover:bg-red-900 transition-colors"
                        >
                          Test Backend Error
                        </button>
                        <button
                          onClick={() => navigate('/')}
                          className="px-4 py-2 rounded-xl bg-gray-600 text-white text-sm hover:bg-gray-700 transition-colors"
                        >
                          Back to Idle
                        </button>
                        <button
                          onClick={() => navigate('/welcome')}
                          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors"
                        >
                          Back to Welcome
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {state === STATES.WELCOME && (
              <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center z-10 px-4 sm:px-6">
                <h1 className="text-3xl sm:text-4xl font-black mb-4 text-white">
                  Welcome to Krizz
                </h1>
                
                <p className="text-base sm:text-lg font-medium mb-6 sm:mb-8 text-white">
                  Please read the rules below before starting your chat
                </p>

                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">
                  Campus Chat Rules
                </h2>
                
                <div className="mb-6 sm:mb-8 space-y-3 max-w-2xl w-full">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 sm:p-4">
                    <p className="text-base sm:text-lg font-bold text-red-400">
                      Must be a current student with valid campus access
                    </p>
                      </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4">
                    <p className="text-base sm:text-lg text-white">
                      No inappropriate content or conversations
                    </p>
                    </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4">
                    <p className="text-base sm:text-lg text-white">
                      Be respectful and kind to fellow students
                    </p>
                            </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4">
                    <p className="text-base sm:text-lg text-white">
                      No sharing of personal information
                    </p>
                          </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4">
                    <p className="text-base sm:text-lg text-white">
                      Breaking any rules results in a permanent ban
                    </p>
                        </div>
                      </div>
                      
                <button
                  onClick={handleStartConnection}
                  className="bg-white text-black py-3 px-8 sm:py-4 sm:px-12 rounded-2xl font-black text-lg sm:text-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                >
                  Start Chat
                </button>
                    </div>
                  )}

                  {state === STATES.CHATTING && (
              <div className="w-full h-full">
                      
                      <ChatBox 
                        messages={messages} 
                        onSendMessage={handleSendMessage} 
                        onDisconnect={handleDisconnect}
                        onNewChat={handleNewChat}
                        isDarkMode={isDarkMode}
                        onStrangerTyping={isStrangerTyping}
                      />
              </div>
            )}

            {state !== STATES.IDLE && state !== STATES.CHATTING && (
              <div className="w-full max-w-5xl mx-auto">
                <div className={`rounded-4xl shadow-2xl p-8 sm:p-12 transition-all duration-700 ${
                  isDarkMode 
                    ? 'bg-black border border-gray-700 shadow-white/5' 
                    : 'bg-white/80 border border-slate-200/50 shadow-slate-900/20'
                } backdrop-blur-2xl`}>
                  {state === STATES.CONNECTING && (
                    <div className="text-center py-20">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-8 ${
                        isDarkMode 
                          ? 'bg-white/10 border-2 border-white/20' 
                          : 'bg-slate-900/10 border-2 border-slate-900/20'
                      }`}>
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-white border-r-white/50"></div>
                      </div>
                      <div className={`text-3xl font-bold mb-6 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>Connecting to server...</div>
                      <p className={`text-lg ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>Please wait while we establish your connection</p>
                    </div>
                  )}
                  {state === STATES.SEARCHING && (
                    <div className="text-center py-20">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-8 ${
                        isDarkMode 
                          ? 'bg-white/10 border-2 border-white/20' 
                          : 'bg-slate-900/10 border-2 border-slate-900/20'
                      }`}>
                        <span className="text-4xl">🔍</span>
                      </div>
                      <div className={`text-3xl font-bold mb-6 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>Looking for someone to chat with...</div>
                      
                      {/* Online Count */}
                      <div className={`mb-12 p-8 rounded-3xl ${
                        isDarkMode ? 'bg-black border border-gray-700' : 'bg-slate-100/50 border border-slate-200/50'
                      } backdrop-blur-sm`}>
                        <div className="text-center">
                          <div className={`text-4xl font-black mb-2 ${
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }`}>
                            {onlineStats.onlineUsers || 0}
                          </div>
                          <div className={`text-lg font-medium ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>People Online Now</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-white border-r-white/50"></div>
                      </div>
                    </div>
                  )}
                  {state === STATES.DISCONNECTED && (
                    <div className="text-center py-20">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-8 ${
                        isDarkMode 
                          ? 'bg-red-500/20 border-2 border-red-500/30' 
                          : 'bg-red-100 border-2 border-red-200'
                      }`}>
                        <span className="text-4xl">😔</span>
                      </div>
                      <div className={`text-3xl font-bold mb-6 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>Stranger left the chat.</div>
                      <p className={`text-lg mb-8 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>Don't worry! You can start a new conversation anytime.</p>
                      <button
                        onClick={() => navigate('/')}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/20 hover:shadow-white/40 hover:scale-105' 
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:scale-105'
                        }`}
                      >
                        Start New Chat
                      </button>
                    </div>
                  )}
                  {state === STATES.BACKEND_ERROR && (
                    <div className="text-center py-20">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-8 ${
                        isDarkMode 
                          ? 'bg-red-500/20 border-2 border-red-500/30' 
                          : 'bg-red-100 border-2 border-red-200'
                      }`}>
                        <span className="text-4xl">⚠️</span>
                      </div>
                      <div className={`text-3xl font-bold mb-6 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>Connection Error</div>
                      <p className={`text-lg mb-8 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>Could not connect to the server. Please check your connection and try again.</p>
                      <button
                        onClick={() => navigate('/')}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/20 hover:shadow-white/40 hover:scale-105' 
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:scale-105'
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

// Main App Component with Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;