import React, { useState, useRef, useEffect } from 'react';

const ChatBox = ({ messages, onSendMessage, onDisconnect, onNewChat, isDarkMode }) => {
  const [inputText, setInputText] = useState('');
  const [buttonState, setButtonState] = useState('stop'); // 'stop', 'really', 'new'
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
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
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 min-h-0">
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
                  : 'bg-red-600 text-white'
              }`}>
                {message.from !== 'system' && (
                  <div className="text-xs sm:text-sm font-medium mb-1">
                    {message.from === 'me' ? 'You' : 'Stranger'}
                  </div>
                )}
                <p className="text-sm sm:text-sm break-words">{message.text}</p>
              </div>
            </div>
          ))
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
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
          />
          
          {/* GIF and Emoji Buttons - Right */}
          <button
            type="button"
            className="px-2 py-2 sm:px-3 sm:py-3 rounded-lg bg-gray-800 text-white text-xs sm:text-sm hover:bg-gray-700 transition-colors flex-shrink-0 min-w-[40px] sm:min-w-[50px]"
          >
            GIF
          </button>
          
          <button
            type="button"
            className="px-2 py-2 sm:px-3 sm:py-3 rounded-lg bg-gray-800 text-white text-xs sm:text-sm hover:bg-gray-700 transition-colors flex-shrink-0 min-w-[40px] sm:min-w-[50px]"
          >
            😊
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
