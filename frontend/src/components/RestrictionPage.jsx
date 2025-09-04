import React from 'react';

const RestrictionPage = ({ isDarkMode }) => {
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900'
    }`}>
      <div className={`max-w-3xl mx-auto text-center animate-fade-in-up ${
        isDarkMode ? 'bg-black' : 'bg-white/80'
      } backdrop-blur-2xl rounded-4xl shadow-2xl p-10 sm:p-16 border ${
        isDarkMode ? 'border-gray-700' : 'border-slate-200/50'
      }`}>
        {/* Enhanced Icon */}
        <div className="mb-10">
          <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center transition-all duration-500 ${
            isDarkMode 
              ? 'bg-red-500/20 border-2 border-red-500/30 shadow-2xl shadow-red-500/20' 
              : 'bg-red-100 border-2 border-red-200 shadow-2xl shadow-red-200/20'
          }`}>
            <span className="text-7xl">🚫</span>
          </div>
        </div>

        {/* Enhanced Title */}
        <h1 className={`text-4xl sm:text-5xl font-black mb-8 tracking-tight ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>
          Access Restricted
        </h1>

        {/* Enhanced Message */}
        <div className={`mb-10 ${
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          <p className="text-xl mb-4 leading-relaxed">
            This anonymous chat application is only available to students connected to the college WiFi network.
          </p>
          <p className="text-lg">
            Please connect to your college's WiFi network to access this service.
          </p>
        </div>

        {/* Enhanced Instructions */}
        <div className={`mb-10 p-8 rounded-3xl ${
          isDarkMode ? 'bg-black border border-gray-700' : 'bg-slate-100/50 border border-slate-200/50'
        }`}>
          <h3 className={`text-xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-slate-800'
          }`}>
            How to connect:
          </h3>
          <ol className={`text-left space-y-4 text-base ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <li className="flex items-start space-x-4">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isDarkMode ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-600'
              }`}>
                1
              </span>
              <span className="pt-1">Go to your device's WiFi settings</span>
            </li>
            <li className="flex items-start space-x-4">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isDarkMode ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-600'
              }`}>
                2
              </span>
              <span className="pt-1">Connect to your college's WiFi network</span>
            </li>
            <li className="flex items-start space-x-4">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isDarkMode ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-600'
              }`}>
                3
              </span>
              <span className="pt-1">Refresh this page once connected</span>
            </li>
          </ol>
        </div>

        {/* Enhanced Contact Info */}
        <div className={`text-base mb-10 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <p className="mb-2">If you're already connected to college WiFi and still seeing this message,</p>
          <p>please contact your IT department for assistance.</p>
        </div>

        {/* Enhanced Refresh Button */}
        <div className="mt-10">
          <button
            onClick={() => window.location.reload()}
            className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 ${
              isDarkMode 
                ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/20 hover:shadow-white/40' 
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/40'
            }`}
          >
            🔄 Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestrictionPage;
