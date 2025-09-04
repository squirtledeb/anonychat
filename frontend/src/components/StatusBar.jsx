import React from 'react';

const StatusBar = ({ state, isDarkMode }) => {
  const getStatusInfo = () => {
    switch (state) {
      case 'idle':
        return { 
          text: 'Ready to chat', 
          color: isDarkMode ? 'text-slate-300' : 'text-slate-600',
          bg: isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/50',
          border: isDarkMode ? 'border-slate-700/50' : 'border-slate-200/50',
          icon: '💬',
          iconBg: isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200/50'
        };
      case 'searching':
        return { 
          text: 'Searching for stranger...', 
          color: isDarkMode ? 'text-amber-300' : 'text-amber-600',
          bg: isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100/50',
          border: isDarkMode ? 'border-amber-500/30' : 'border-amber-200/50',
          icon: '🔍',
          iconBg: isDarkMode ? 'bg-amber-500/30' : 'bg-amber-200/50'
        };
      case 'chatting':
        return { 
          text: 'Connected with stranger', 
          color: isDarkMode ? 'text-emerald-300' : 'text-emerald-600',
          bg: isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100/50',
          border: isDarkMode ? 'border-emerald-500/30' : 'border-emerald-200/50',
          icon: '✅',
          iconBg: isDarkMode ? 'bg-emerald-500/30' : 'bg-emerald-200/50'
        };
      case 'disconnected':
        return { 
          text: 'Stranger left', 
          color: isDarkMode ? 'text-red-300' : 'text-red-600',
          bg: isDarkMode ? 'bg-red-500/20' : 'bg-red-100/50',
          border: isDarkMode ? 'border-red-500/30' : 'border-red-200/50',
          icon: '❌',
          iconBg: isDarkMode ? 'bg-red-500/30' : 'bg-red-200/50'
        };
      case 'backend_error':
        return { 
          text: 'Connection error', 
          color: isDarkMode ? 'text-red-300' : 'text-red-600',
          bg: isDarkMode ? 'bg-red-500/20' : 'bg-red-100/50',
          border: isDarkMode ? 'border-red-500/30' : 'border-red-200/50',
          icon: '⚠️',
          iconBg: isDarkMode ? 'bg-red-500/30' : 'bg-red-200/50'
        };
      default:
        return { 
          text: 'Unknown', 
          color: isDarkMode ? 'text-slate-300' : 'text-slate-600',
          bg: isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/50',
          border: isDarkMode ? 'border-slate-700/50' : 'border-slate-200/50',
          icon: '❓',
          iconBg: isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200/50'
        };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="mb-8 animate-fade-in-down">
      <div className={`inline-flex items-center px-8 py-4 rounded-3xl text-sm font-bold shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:scale-105 ${
        status.bg
      } ${status.border} border`}>
        <div className={`mr-4 p-3 rounded-2xl ${status.iconBg} animate-pulse`}>
          <span className="text-xl">{status.icon}</span>
        </div>
        <span className={`font-bold text-lg ${status.color}`}>{status.text}</span>
      </div>
    </div>
  );
};

export default StatusBar;
