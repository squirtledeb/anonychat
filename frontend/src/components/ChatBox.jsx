import React, { useState, useRef, useEffect } from 'react';

const ChatBox = ({ messages, onSendMessage, onDisconnect, onNewChat, isDarkMode, onStrangerTyping }) => {
  const [inputText, setInputText] = useState('');
  const [buttonState, setButtonState] = useState('stop'); // 'stop', 'really', 'new'
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        }
      }
      
      // Enter key in GIF search - perform search
      if (e.key === 'Enter' && showGifPicker && gifSearchRef.current && document.activeElement === gifSearchRef.current) {
        e.preventDefault();
        searchGifs(gifSearchQuery);
      }
    };

    const handleClickOutside = (e) => {
      // Close pickers if clicking outside
      if (showGifPicker || showEmojiPicker) {
        const gifPicker = document.querySelector('[data-gif-picker]');
        const emojiPicker = document.querySelector('[data-emoji-picker]');
        
        if (gifPicker && !gifPicker.contains(e.target) && !e.target.closest('[data-gif-button]')) {
          setShowGifPicker(false);
          setGifSearchQuery('');
        }
        
        if (emojiPicker && !emojiPicker.contains(e.target) && !e.target.closest('[data-emoji-button]')) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGifPicker, showEmojiPicker, gifSearchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    // Note: We don't show typing indicator for local user typing
    // The typing indicator should only show when stranger is typing
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
      // Try Giphy API first, but with better error handling
      const response = await fetch('https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=8&rating=g', {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const gifs = data.data.map(gif => ({
            id: gif.id,
            url: gif.images.original.url,
            title: gif.title || 'GIF',
            preview: gif.images.fixed_height_small.url || gif.images.original.url
          }));
          setGifs(gifs);
          return;
        }
      }
      
      // If API fails, use diverse fallback GIFs with different URLs
      const fallbackGifs = [
        {
          id: 'gif1',
          url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
          title: 'Happy Wednesday',
          preview: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif'
        },
        {
          id: 'gif2',
          url: 'https://media.giphy.com/media/26BRrSvJUa5yIYQgU/giphy.gif',
          title: 'Good Morning',
          preview: 'https://media.giphy.com/media/26BRrSvJUa5yIYQgU/giphy.gif'
        },
        {
          id: 'gif3',
          url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
          title: 'Happy Humpday!',
          preview: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif'
        },
        {
          id: 'gif4',
          url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
          title: 'Hello Hump Day',
          preview: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif'
        },
        {
          id: 'gif5',
          url: 'https://media.giphy.com/media/26BRrSvJUa5yIYQgU/giphy.gif',
          title: 'Have a Great Day',
          preview: 'https://media.giphy.com/media/26BRrSvJUa5yIYQgU/giphy.gif'
        },
        {
          id: 'gif6',
          url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
          title: 'Smile More',
          preview: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif'
        }
      ];
      setGifs(fallbackGifs);
    } catch (error) {
      console.error('Error loading GIFs:', error);
      // Always show fallback GIFs even on error
      const fallbackGifs = [
        {
          id: 'error1',
          url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
          title: 'Happy Wednesday',
          preview: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif'
        },
        {
          id: 'error2',
          url: 'https://media.giphy.com/media/26BRrSvJUa5yIYQgU/giphy.gif',
          title: 'Good Morning',
          preview: 'https://media.giphy.com/media/26BRrSvJUa5yIYQgU/giphy.gif'
        },
        {
          id: 'error3',
          url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
          title: 'Happy Humpday!',
          preview: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif'
        },
        {
          id: 'error4',
          url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
          title: 'Hello Hump Day',
          preview: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif'
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
      // Try Giphy search API
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodedQuery}&limit=8&rating=g`, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const gifs = data.data.map(gif => ({
            id: gif.id,
            url: gif.images.original.url,
            title: gif.title || query,
            preview: gif.images.fixed_height_small.url || gif.images.original.url
          }));
          setGifs(gifs);
          return;
        }
      }
      
      // If search fails, show filtered fallback GIFs based on query
      const fallbackGifs = [
        {
          id: `search1_${query}`,
          url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
          title: `Search result for "${query}"`,
          preview: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif'
        },
        {
          id: `search2_${query}`,
          url: 'https://media.giphy.com/media/26BRrSvJUa5yIYQgU/giphy.gif',
          title: `Another result for "${query}"`,
          preview: 'https://media.giphy.com/media/26BRrSvJUa5yIYQgU/giphy.gif'
        },
        {
          id: `search3_${query}`,
          url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
          title: `More "${query}" content`,
          preview: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif'
        },
        {
          id: `search4_${query}`,
          url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
          title: `Best "${query}" GIF`,
          preview: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif'
        }
      ];
      setGifs(fallbackGifs);
    } catch (error) {
      console.error('Error searching GIFs:', error);
      // On error, show fallback search results
      const fallbackGifs = [
        {
          id: `error1_${query}`,
          url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
          title: `Search result for "${query}"`,
          preview: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif'
        },
        {
          id: `error2_${query}`,
          url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
          title: `Another result for "${query}"`,
          preview: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif'
        }
      ];
      setGifs(fallbackGifs);
    } finally {
      setIsLoadingGifs(false);
    }
  };

  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowGifPicker(false);
  };

  const handleEmojiSelect = (emoji) => {
    console.log('Emoji selected:', emoji);
    if (onSendMessage) {
      onSendMessage(emoji);
    } else {
      console.error('onSendMessage function not available');
    }
    setShowEmojiPicker(false);
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
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 pb-4 sm:pb-6 space-y-3 min-h-0">
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
                  ? 'bg-gray-700 text-gray-300'
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
              <div className="text-xs sm:text-sm font-medium mb-1 text-gray-300">
                Stranger
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm">is typing</span>
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
          
          {/* Emoji button - hidden on mobile */}
          <button
            type="button"
            onClick={handleEmojiClick}
            data-emoji-button
            className="hidden sm:block px-2 py-2 sm:px-3 sm:py-3 rounded-lg bg-gray-800 text-white text-xs sm:text-sm hover:bg-gray-700 transition-colors flex-shrink-0 min-w-[40px] sm:min-w-[50px]"
          >
            😊
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

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div data-emoji-picker className="absolute bottom-20 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-2xl z-50">
          <div className="grid grid-cols-6 gap-2">
            {[
              // Row 1: Happy faces
              '😀', '😂', '😊', '😍', '🤔', '😎',
              // Row 2: Celebrations and reactions
              '🥳', '👍', '❤️', '🔥', '😢', '😡',
              // Row 3: Expressions and achievements
              '🤯', '💯', '🎉', '🚀', '💪', '👏',
              // Row 4: Positive reactions
              '🙌', '🤝', '💖', '🌟', '✨', '🎯',
              // Row 5: Special items
              '💎', '🎊', '🎈', '🎁', '🏆', '🎂',
              // Row 6: More expressions
              '😘', '😜', '🤪', '😇', '🥰', '😋',
              // Row 7: Additional reactions
              '🤨', '😏', '😒', '🙄', '😬', '🤐',
              // Row 8: More emotions
              '😴', '🤤', '😪', '🤢', '🤮', '🤧',
              // Row 9: Weather and nature
              '☀️', '🌙', '⭐', '🌈', '☁️', '❄️',
              // Row 10: Animals
              '🐶', '🐱', '🐭', '🐹', '🐰', '🦊',
              // Row 11: More animals
              '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
              // Row 12: Food and drinks
              '🍕', '🍔', '🍟', '🌭', '🥪', '🌮',
              // Row 13: More food
              '🍜', '🍱', '🍣', '🍤', '🍙', '🍚',
              // Row 14: Drinks and desserts
              '☕', '🍵', '🥤', '🍺', '🍷', '🍰',
              // Row 15: Activities and sports
              '⚽', '🏀', '🏈', '⚾', '🎾', '🏐',
              // Row 16: More sports
              '🏓', '🏸', '🏒', '🏑', '🎯', '🏹',
              // Row 17: Music and entertainment
              '🎵', '🎶', '🎤', '🎧', '🎸', '🎹',
              // Row 18: More entertainment
              '🎭', '🎪', '🎨', '🎬', '📺', '🎮',
              // Row 19: Technology and objects
              '📱', '💻', '⌚', '📷', '📹', '🎥',
              // Row 20: More objects
              '📚', '📖', '✏️', '✒️', '🖊️', '🖋️',
              // Row 21: Travel and transportation
              '✈️', '🚁', '🚀', '🚗', '🚙', '🚌',
              // Row 22: More transportation
              '🚲', '🏍️', '🚂', '🚆', '🚇', '🚊',
              // Row 23: Buildings and places
              '🏠', '🏡', '🏢', '🏣', '🏤', '🏥',
              // Row 24: More places
              '🏦', '🏨', '🏩', '🏪', '🏫', '🏬',
              // Row 25: Nature and plants
              '🌱', '🌿', '🍀', '🌾', '🌵', '🌲',
              // Row 26: More nature
              '🌳', '🌴', '🌰', '🌺', '🌻', '🌷',
              // Row 27: Hand gestures
              '👋', '🤚', '🖐️', '✋', '🖖', '👌',
              // Row 28: More gestures
              '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
              // Row 29: Body parts
              '👀', '👁️', '👂', '👃', '👄', '👅',
              // Row 30: More body parts
              '🦷', '🦴', '👶', '🧒', '👦', '👧',
              // Row 31: People
              '👨', '👩', '🧑', '👴', '👵', '👱',
              // Row 32: More people
              '👲', '🧔', '👳', '👮', '👷', '💂',
              // Row 33: Clothing
              '👕', '👖', '🧥', '🧦', '👗', '👘',
              // Row 34: More clothing
              '👙', '👚', '👛', '👜', '👝', '🎒',
              // Row 35: Accessories
              '👞', '👟', '👠', '👡', '👢', '👑',
              // Row 36: More accessories
              '👒', '🎩', '🎓', '🧢', '⛑️', '💍',
              // Row 37: Symbols and signs
              '💎', '🔮', '🔭', '🔬', '📡', '💻',
              // Row 38: More symbols
              '📱', '☎️', '📞', '📟', '📠', '🔋',
              // Row 39: Tools and equipment
              '🔧', '🔨', '⚒️', '🛠️', '⚙️', '🔩',
              // Row 40: More tools
              '⚖️', '🔗', '⛓️', '🧰', '🧲', '⚗️',
              // Row 41: Medical and science
              '🧪', '🧫', '🧬', '🦠', '💊', '💉',
              // Row 42: More medical
              '🩹', '🩺', '🚑', '🚨', '🚔', '🚓',
              // Row 43: Flags and countries
              '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈',
              // Row 44: More flags
              '🏳️‍⚧️', '🏴‍☠️', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺',
              // Row 45: Even more flags
              '🇫🇷', '🇩🇪', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳',
              // Row 46: Additional flags
              '🇧🇷', '🇷🇺', '🇮🇹', '🇪🇸', '🇲🇽', '🇳🇱',
              // Row 47: More miscellaneous
              '🎊', '🎉', '🎈', '🎁', '🎀', '🎂',
              // Row 48: Final row
              '🍰', '🧁', '🍪', '🍩', '🍫', '🍬'
            ].map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
                className="p-2 hover:bg-gray-700 rounded-lg text-xl transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GIF Picker */}
      {showGifPicker && (
        <div data-gif-picker className="absolute bottom-20 right-4 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-2xl z-50 w-72 max-h-72 overflow-hidden">
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
          <div className="max-h-40 overflow-y-auto">
            {isLoadingGifs ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-white border-r-white/50"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
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
