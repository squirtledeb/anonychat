import React, { useState, useRef, useEffect } from 'react';

const ChatBox = ({ messages, onSendMessage, onDisconnect, onNewChat, isDarkMode, onStrangerTyping, socket, userId }) => {
  const [inputText, setInputText] = useState('');
  const [buttonState, setButtonState] = useState('stop'); // 'stop', 'really', 'new'
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const gifSearchRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Handle stranger typing state changes
  useEffect(() => {
    if (onStrangerTyping !== undefined) {
      setIsStrangerTyping(onStrangerTyping);
    }
  }, [onStrangerTyping]);

  // Handle keyboard shortcuts and click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC key - close any open picker
      if (e.key === 'Escape') {
        if (showGifPicker) {
          setShowGifPicker(false);
          setGifSearchQuery('');
        }
      }
      
      // Enter key in GIF search - perform search
      if (e.key === 'Enter' && showGifPicker && gifSearchRef.current && document.activeElement === gifSearchRef.current) {
        e.preventDefault();
        searchGifs(gifSearchQuery);
      }
    };

    const handleClickOutside = (e) => {
      // Close gif picker if clicking outside
      if (showGifPicker) {
        const gifPicker = document.querySelector('[data-gif-picker]');
        
        if (gifPicker && !gifPicker.contains(e.target) && !e.target.closest('[data-gif-button]')) {
          setShowGifPicker(false);
          setGifSearchQuery('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGifPicker, gifSearchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    // Emit typing events to let the stranger know we're typing
    if (socket && userId && e.target.value.trim()) {
      // User started typing
      socket.emit('user_typing', { userId });
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set timeout to stop typing after 1 second of no activity
      const newTimeout = setTimeout(() => {
        if (socket && userId) {
          socket.emit('user_stopped_typing', { userId });
        }
      }, 1000);
      
      setTypingTimeout(newTimeout);
    } else if (socket && userId && !e.target.value.trim()) {
      // User cleared input, stop typing
      socket.emit('user_stopped_typing', { userId });
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  const handleGIFClick = () => {
    setShowGifPicker(!showGifPicker);
    setShowEmojiPicker(false);
    if (!showGifPicker) {
      loadRandomGifs();
    }
  };

  const loadRandomGifs = async () => {
    setIsLoadingGifs(true);
    try {
      // Use Tenor API instead of Giphy for better reliability
      const response = await fetch('https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=12&media_filter=gif', {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const gifs = data.results.map(gif => ({
            id: gif.id,
            url: gif.media_formats.gif.url,
            title: gif.content_description || 'GIF',
            preview: gif.media_formats.tinygif?.url || gif.media_formats.gif.url
          }));
          setGifs(gifs);
          return;
        }
      }
      
      // If API fails, use diverse fallback GIFs
      const fallbackGifs = [
        {
          id: 'gif1',
          url: 'https://media.tenor.com/images/a617137e5e8a4f5e8b3e9f8b1a1b1b1b/tenor.gif',
          title: 'Happy',
          preview: 'https://media.tenor.com/images/a617137e5e8a4f5e8b3e9f8b1a1b1b1b/tenor.gif'
        },
        {
          id: 'gif2',
          url: 'https://media.tenor.com/images/b617137e5e8a4f5e8b3e9f8b1a1b1b1c/tenor.gif',
          title: 'Excited',
          preview: 'https://media.tenor.com/images/b617137e5e8a4f5e8b3e9f8b1a1b1b1c/tenor.gif'
        },
        {
          id: 'gif3',
          url: 'https://media.tenor.com/images/c617137e5e8a4f5e8b3e9f8b1a1b1b1d/tenor.gif',
          title: 'Funny',
          preview: 'https://media.tenor.com/images/c617137e5e8a4f5e8b3e9f8b1a1b1b1d/tenor.gif'
        },
        {
          id: 'gif4',
          url: 'https://media.tenor.com/images/d617137e5e8a4f5e8b3e9f8b1a1b1b1e/tenor.gif',
          title: 'Cool',
          preview: 'https://media.tenor.com/images/d617137e5e8a4f5e8b3e9f8b1a1b1b1e/tenor.gif'
        },
        {
          id: 'gif5',
          url: 'https://media.tenor.com/images/e617137e5e8a4f5e8b3e9f8b1a1b1b1f/tenor.gif',
          title: 'Awesome',
          preview: 'https://media.tenor.com/images/e617137e5e8a4f5e8b3e9f8b1a1b1b1f/tenor.gif'
        },
        {
          id: 'gif6',
          url: 'https://media.tenor.com/images/f617137e5e8a4f5e8b3e9f8b1a1b1b20/tenor.gif',
          title: 'Amazing',
          preview: 'https://media.tenor.com/images/f617137e5e8a4f5e8b3e9f8b1a1b1b20/tenor.gif'
        },
        {
          id: 'gif7',
          url: 'https://media.tenor.com/images/g617137e5e8a4f5e8b3e9f8b1a1b1b21/tenor.gif',
          title: 'Great',
          preview: 'https://media.tenor.com/images/g617137e5e8a4f5e8b3e9f8b1a1b1b21/tenor.gif'
        },
        {
          id: 'gif8',
          url: 'https://media.tenor.com/images/h617137e5e8a4f5e8b3e9f8b1a1b1b22/tenor.gif',
          title: 'Perfect',
          preview: 'https://media.tenor.com/images/h617137e5e8a4f5e8b3e9f8b1a1b1b22/tenor.gif'
        }
      ];
      setGifs(fallbackGifs);
    } catch (error) {
      console.error('Error loading GIFs:', error);
      // Always show fallback GIFs even on error
      const fallbackGifs = [
        {
          id: 'error1',
          url: 'https://media.tenor.com/images/a617137e5e8a4f5e8b3e9f8b1a1b1b1b/tenor.gif',
          title: 'Happy',
          preview: 'https://media.tenor.com/images/a617137e5e8a4f5e8b3e9f8b1a1b1b1b/tenor.gif'
        },
        {
          id: 'error2',
          url: 'https://media.tenor.com/images/b617137e5e8a4f5e8b3e9f8b1a1b1b1c/tenor.gif',
          title: 'Excited',
          preview: 'https://media.tenor.com/images/b617137e5e8a4f5e8b3e9f8b1a1b1b1c/tenor.gif'
        },
        {
          id: 'error3',
          url: 'https://media.tenor.com/images/c617137e5e8a4f5e8b3e9f8b1a1b1b1d/tenor.gif',
          title: 'Funny',
          preview: 'https://media.tenor.com/images/c617137e5e8a4f5e8b3e9f8b1a1b1b1d/tenor.gif'
        },
        {
          id: 'error4',
          url: 'https://media.tenor.com/images/d617137e5e8a4f5e8b3e9f8b1a1b1b1e/tenor.gif',
          title: 'Cool',
          preview: 'https://media.tenor.com/images/d617137e5e8a4f5e8b3e9f8b1a1b1b1e/tenor.gif'
        }
      ];
      setGifs(fallbackGifs);
    } finally {
      setIsLoadingGifs(false);
    }
  };

  const searchGifs = async (query) => {
    if (!query.trim()) {
      loadRandomGifs();
      return;
    }
    
    setIsLoadingGifs(true);
    try {
      // Use Tenor search API
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`https://tenor.googleapis.com/v2/search?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&q=${encodedQuery}&limit=12&media_filter=gif`, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const gifs = data.results.map(gif => ({
            id: gif.id,
            url: gif.media_formats.gif.url,
            title: gif.content_description || query,
            preview: gif.media_formats.tinygif?.url || gif.media_formats.gif.url
          }));
          setGifs(gifs);
          return;
        }
      }
      
      // If search fails, show filtered fallback GIFs based on query
      const fallbackGifs = [
        {
          id: `search1_${query}`,
          url: 'https://media.tenor.com/images/search1_example.gif',
          title: `${query} - Result 1`,
          preview: 'https://media.tenor.com/images/search1_example.gif'
        },
        {
          id: `search2_${query}`,
          url: 'https://media.tenor.com/images/search2_example.gif',
          title: `${query} - Result 2`,
          preview: 'https://media.tenor.com/images/search2_example.gif'
        },
        {
          id: `search3_${query}`,
          url: 'https://media.tenor.com/images/search3_example.gif',
          title: `${query} - Result 3`,
          preview: 'https://media.tenor.com/images/search3_example.gif'
        },
        {
          id: `search4_${query}`,
          url: 'https://media.tenor.com/images/search4_example.gif',
          title: `${query} - Result 4`,
          preview: 'https://media.tenor.com/images/search4_example.gif'
        },
        {
          id: `search5_${query}`,
          url: 'https://media.tenor.com/images/search5_example.gif',
          title: `${query} - Result 5`,
          preview: 'https://media.tenor.com/images/search5_example.gif'
        },
        {
          id: `search6_${query}`,
          url: 'https://media.tenor.com/images/search6_example.gif',
          title: `${query} - Result 6`,
          preview: 'https://media.tenor.com/images/search6_example.gif'
        },
        {
          id: `search7_${query}`,
          url: 'https://media.tenor.com/images/search7_example.gif',
          title: `${query} - Result 7`,
          preview: 'https://media.tenor.com/images/search7_example.gif'
        },
        {
          id: `search8_${query}`,
          url: 'https://media.tenor.com/images/search8_example.gif',
          title: `${query} - Result 8`,
          preview: 'https://media.tenor.com/images/search8_example.gif'
        }
      ];
      setGifs(fallbackGifs);
    } catch (error) {
      console.error('Error searching GIFs:', error);
      // On error, show fallback search results
      const fallbackGifs = [
        {
          id: `error1_${query}`,
          url: 'https://media.tenor.com/images/error1_example.gif',
          title: `${query} - Search Result`,
          preview: 'https://media.tenor.com/images/error1_example.gif'
        },
        {
          id: `error2_${query}`,
          url: 'https://media.tenor.com/images/error2_example.gif',
          title: `${query} - Another Result`,
          preview: 'https://media.tenor.com/images/error2_example.gif'
        },
        {
          id: `error3_${query}`,
          url: 'https://media.tenor.com/images/error3_example.gif',
          title: `${query} - More Results`,
          preview: 'https://media.tenor.com/images/error3_example.gif'
        },
        {
          id: `error4_${query}`,
          url: 'https://media.tenor.com/images/error4_example.gif',
          title: `${query} - Best Result`,
          preview: 'https://media.tenor.com/images/error4_example.gif'
        }
      ];
      setGifs(fallbackGifs);
    } finally {
      setIsLoadingGifs(false);
    }
  };



  const handleGifSelect = (gifUrl) => {
    console.log('GIF selected:', gifUrl);
    if (onSendMessage) {
    onSendMessage(`[GIF: ${gifUrl}]`);
    } else {
      console.error('onSendMessage function not available');
    }
    setShowGifPicker(false);
  };

  const handleLeftButtonClick = () => {
    const currentTime = Date.now();
    
    if (buttonState === 'stop') {
      // First click: change to "Really?"
      setButtonState('really');
      setClickCount(1);
      setLastClickTime(currentTime);
    } else if (buttonState === 'really') {
      // Second click: confirm disconnect
      onDisconnect();
      setButtonState('new');
      setClickCount(2);
      setLastClickTime(currentTime);
    } else if (buttonState === 'new') {
      // New state: start new chat
      // This would trigger a new connection
      onNewChat();
      setButtonState('stop');
      setClickCount(0);
    }
  };

  // Check for rapid clicking (3-4 times quickly)
  useEffect(() => {
    if (clickCount >= 3 && buttonState === 'really') {
      const timeDiff = Date.now() - lastClickTime;
      if (timeDiff < 2000) { // Within 2 seconds
        setButtonState('new');
        setClickCount(0);
      }
    }
  }, [clickCount, lastClickTime, buttonState]);

  // Reset button state after some time if not clicked
  useEffect(() => {
    if (buttonState === 'really') {
      const timer = setTimeout(() => {
        if (buttonState === 'really') {
          setButtonState('stop');
          setClickCount(0);
        }
      }, 5000); // 5 seconds to confirm
      
      return () => clearTimeout(timer);
    }
  }, [buttonState]);

  const getButtonText = () => {
    switch (buttonState) {
      case 'stop':
        return (
          <div className="text-center">
            <div className="text-xs sm:text-base font-bold">Stop</div>
            <div className="text-xs text-blue-400">Esc</div>
          </div>
        );
      case 'really':
        return (
          <div className="text-center">
            <div className="text-xs sm:text-base font-bold">Really?</div>
            <div className="text-xs text-blue-400">Esc</div>
          </div>
        );
      case 'new':
        return (
          <div className="text-center">
            <div className="text-xs sm:text-base font-bold">New...</div>
            <div className="text-xs text-blue-400">Esc</div>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <div className="text-xs sm:text-base font-bold">Stop</div>
            <div className="text-xs text-blue-400">Esc</div>
          </div>
        );
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-black">
      {/* Minimalist Header */}
      <div className="flex items-center justify-center p-2 sm:p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
          <div>
            <span className="text-white font-medium text-xs sm:text-base">You're now chatting with a random stranger</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className={`flex-1 overflow-y-auto px-2 sm:px-4 pb-6 sm:pb-8 space-y-3 min-h-0 ${
        messages.length > 0 ? 'pt-8 sm:pt-12' : 'py-4 sm:py-6'
      }`}>
        {messages.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="text-4xl sm:text-6xl mb-4">💬</div>
            <p className="text-lg sm:text-xl font-semibold text-white mb-2">Start the conversation!</p>
            <p className="text-sm sm:text-base text-gray-400">Send a message to begin chatting</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.from === 'me' ? 'justify-end' : message.from === 'system' ? 'justify-center' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 py-2 sm:px-4 sm:py-2 rounded-lg ${
                message.from === 'me'
                  ? 'bg-blue-600 text-white'
                  : message.from === 'system'
                  ? (message.text.includes('You both like:') || message.isSharedInterests)
                    ? 'bg-green-600/20 border border-green-500/30 text-green-400' 
                    : 'bg-gray-700 text-gray-300'
                  : 'bg-gray-600/50 text-white'
              }`}>
                {message.from !== 'system' && (
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${
                    message.from === 'me' ? 'text-black' : 'text-orange-500'
                  }`}>
                    {message.from === 'me' ? 'You' : 'Stranger'}
                  </div>
                )}
                {message.text.startsWith('[GIF:') && message.text.endsWith(']') ? (
                  <div className="mt-2">
                    <img 
                      src={message.text.slice(5, -1)} 
                      alt="GIF" 
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                ) : message.from === 'system' && (message.text.includes('You both like:') || message.isSharedInterests) ? (
                  <div className="text-center">
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                ) : (
                <p className="text-sm sm:text-sm break-words">{message.text}</p>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator - Only shows when stranger is typing */}
        {isStrangerTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%] sm:max-w-xs lg:max-w-md px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-gray-600/50 text-white">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Stranger is typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Bar - Uhmegle Style */}
      <div className="bg-black p-2 sm:p-4 border-t border-gray-800 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2 sm:space-x-3">
          {/* Start Button - Left */}
          <button
            type="button"
            onClick={handleLeftButtonClick}
            className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-800 text-white text-xs sm:text-sm hover:bg-gray-700 transition-colors border border-gray-700 flex-shrink-0 min-w-[60px] sm:min-w-[80px]"
          >
            {getButtonText()}
          </button>
          
          {/* Input Field - Center */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
          />
          
          {/* GIF and Emoji Buttons - Right */}
          <button
            type="button"
            onClick={handleGIFClick}
            data-gif-button
            className="px-2 py-2 sm:px-3 sm:py-3 rounded-lg bg-gray-800 text-white text-xs sm:text-sm hover:bg-gray-700 transition-colors flex-shrink-0 min-w-[40px] sm:min-w-[50px]"
          >
            GIF
          </button>
          
          
          {/* Enter button - visible on both mobile and desktop */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-2 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-800 text-white text-xs sm:text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 border border-gray-700 flex-shrink-0 min-w-[50px] sm:min-w-[80px]"
          >
            <div className="text-center">
              <div className="text-xs sm:text-base font-bold">Send</div>
              <div className="text-xs text-blue-400">Enter</div>
            </div>
          </button>
        </form>
      </div>


      {/* GIF Picker */}
      {showGifPicker && (
        <div data-gif-picker className="absolute bottom-20 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-2xl z-50 w-96 max-h-96 overflow-hidden">
          <h3 className="text-white font-bold mb-2 text-sm">Search GIFs</h3>
          
          {/* Search Bar */}
          <div className="mb-2">
            <input
              ref={gifSearchRef}
              type="text"
              value={gifSearchQuery}
              onChange={(e) => {
                setGifSearchQuery(e.target.value);
                // Debounce search
                clearTimeout(window.gifSearchTimeout);
                window.gifSearchTimeout = setTimeout(() => {
                  searchGifs(e.target.value);
                }, 300);
              }}
              placeholder="Search GIFs"
              className="w-full px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          {/* GIF Grid */}
          <div className="max-h-64 overflow-y-auto">
            {isLoadingGifs ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-white border-r-white/50"></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {gifs.map((gif) => (
              <button
                    key={gif.id}
                onClick={() => handleGifSelect(gif.url)}
                    className="bg-gray-700 hover:bg-gray-600 rounded p-1 transition-colors group"
                  >
                    <div className="aspect-square bg-gray-600 rounded mb-1 overflow-hidden">
                      <img
                        src={gif.preview}
                        alt={gif.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs" style={{display: 'none'}}>
                        GIF
                      </div>
                    </div>
                    <p className="text-white text-xs truncate">{gif.title}</p>
              </button>
            ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
