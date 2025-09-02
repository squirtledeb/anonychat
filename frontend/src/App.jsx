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
  const [sharedInterests, setSharedInterests] = useState([]);
  const socketRef = useRef(null);
  const [interestInput, setInterestInput] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);

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
        setSharedInterests([]); // Clear shared interests
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
    if (selectedInterests.length === 0) {
      return; // Don't start if no interests
    }
    
    setState(STATES.CONNECTING); // Set state to CONNECTING when button is clicked
    setSharedInterests([]); // Clear previous shared interests
    initializeSocket();
  };

  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
    }
    setState(STATES.IDLE);
    setMessages([]);
    setSharedInterests([]); // Clear shared interests
  };

  const handleSendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit('message', { text, userId });
      setMessages((prevMessages) => [...prevMessages, { text, from: 'me', timestamp: Date.now() }]);
    }
  };

  const addInterest = () => {
    if (interestInput.trim() && !selectedInterests.includes(interestInput.trim())) {
      setSelectedInterests([...selectedInterests, interestInput.trim()]);
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
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {/* Show restriction page if access is denied */}
      {state === STATES.RESTRICTED ? (
        <RestrictionPage isDarkMode={isDarkMode} />
      ) : (
        <>
          {/* Header with Theme Toggle */}
          <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-500 ${
            isDarkMode 
              ? 'bg-black/95 border-gray-800' 
              : 'bg-white/95 border-gray-100'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isDarkMode ? 'bg-white' : 'bg-black'
                  }`}>
                    <span className={`text-xl ${isDarkMode ? 'text-black' : 'text-white'}`}>💬</span>
                  </div>
                  <div>
                    <h1 className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      Krizz
                    </h1>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      
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
                          ? 'bg-white focus:ring-white/20' 
                          : 'bg-gray-200 focus:ring-gray-500'
                      } ${isDarkMode ? 'focus:ring-offset-black' : 'focus:ring-offset-white'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-300 ${
                          isDarkMode ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'
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
              <div className="w-full max-w-2xl mx-auto px-4 text-center">
                {/* Main Title */}
                <div className="mb-12 animate-fade-in-down">
                  <h1 className={`text-6xl sm:text-7xl font-black mb-6 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    Krizz
                  </h1>
                  <p className={`text-xl sm:text-2xl font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Add your interests and start a conversation with another student on campus.
                  </p>
                </div>

                {/* Interest Setup Card */}
                <div className={`w-full max-w-2xl p-10 rounded-3xl border-2 transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-black border-gray-700 shadow-2xl shadow-white/5'
                    : 'bg-white border-gray-200 shadow-2xl shadow-black/10'
                }`}>
                  <h2 className={`text-3xl font-bold text-center mb-8 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    Add Your Interests
                  </h2>
                  
                  {/* Interest Input */}
                  <div className="flex space-x-3 mb-10">
                    <input
                      type="text"
                      placeholder="Type an interest..."
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                      className={`flex-1 px-6 py-4 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${
                        isDarkMode
                          ? 'bg-black border-gray-700 text-white placeholder-gray-400 focus:border-white focus:ring-white/10'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-black focus:ring-black/10'
                      }`}
                    />
                    <button
                      onClick={addInterest}
                      disabled={!interestInput.trim()}
                      className={`px-8 py-4 rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? 'bg-white text-black hover:bg-gray-200'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      Add
                    </button>
                  </div>

                  {/* Selected Interests */}
                  {selectedInterests.length > 0 && (
                    <div className="mb-10">
                      <h3 className={`text-xl font-semibold mb-6 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        Your Interests
                      </h3>
                      <div className="flex flex-wrap gap-3 justify-center">
                        {selectedInterests.map((interest, index) => (
                          <div
                            key={index}
                            className={`px-6 py-3 rounded-full flex items-center space-x-3 ${
                              isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                            } font-medium shadow-lg`}
                          >
                            <span>{interest}</span>
                            <button
                              onClick={() => removeInterest(index)}
                              className="w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 transition-colors flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instruction */}
                  <p className={`text-base mb-10 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Add at least one interest to help find compatible chat partners
                  </p>

                  {/* Start Chat Button */}
                  <button
                    onClick={handleStartChat}
                    disabled={selectedInterests.length === 0 || isConnecting}
                    className={`w-full py-5 px-8 rounded-2xl font-bold text-xl transition-all duration-300 ${
                      selectedInterests.length === 0 || isConnecting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-white text-black hover:bg-gray-200 shadow-2xl'
                          : 'bg-black text-white hover:bg-gray-800 shadow-2xl'
                    }`}
                  >
                    {isConnecting ? 'Connecting...' : 'Start Chatting'}
                  </button>
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
                    <>
                      {/* Shared Interests Display */}
                      {sharedInterests.length > 0 && (
                        <div className={`mb-6 p-6 rounded-2xl border-2 text-center ${
                          isDarkMode
                            ? 'bg-black border-gray-700 shadow-2xl shadow-white/5'
                            : 'bg-white border-gray-200 shadow-2xl shadow-black/10'
                        }`}>
                          <h3 className={`text-xl font-bold mb-3 ${
                            isDarkMode ? 'text-white' : 'text-black'
                          }`}>
                            🎯 You both are interested in:
                          </h3>
                          <div className="flex flex-wrap justify-center gap-2">
                            {sharedInterests.map((interest, index) => (
                              <span
                                key={index}
                                className={`px-4 py-2 rounded-full text-sm font-medium ${
                                  isDarkMode
                                    ? 'bg-white text-black'
                                    : 'bg-black text-white'
                                }`}
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <ChatBox 
                        messages={messages} 
                        onSendMessage={handleSendMessage} 
                        onDisconnect={handleDisconnect}
                        isDarkMode={isDarkMode}
                      />
                    </>
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
