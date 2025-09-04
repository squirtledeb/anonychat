import React from 'react';

const Message = ({ message, isOwn, isDarkMode }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-in-bottom`}>
      <div className={`max-w-xs lg:max-w-md px-6 py-4 rounded-3xl transition-all duration-300 hover:scale-105 ${
        isOwn 
          ? isDarkMode
            ? 'bg-white text-slate-900 shadow-2xl shadow-white/20' 
            : 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20'
          : isDarkMode
            ? 'bg-slate-700/50 text-white border border-slate-600/50 shadow-lg' 
            : 'bg-slate-100 text-slate-800 border border-slate-200/50 shadow-lg'
      }`}>
        <p className="text-base break-words leading-relaxed">{message.text}</p>
        <p className={`text-xs mt-3 opacity-70 font-medium ${
          isOwn 
            ? isDarkMode ? 'text-slate-600' : 'text-slate-400'
            : 'text-slate-400'
        }`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default Message;
