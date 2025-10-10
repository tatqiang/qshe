import React, { useState, useEffect } from 'react';
import { sessionManager } from '../../lib/auth/sessionManager';

export const SessionStatusBadge: React.FC = () => {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (!import.meta.env.DEV) return;

    const updateSessionInfo = () => {
      const info = sessionManager.getSessionInfo();
      setSessionInfo(info);
    };

    // Initial check
    updateSessionInfo();

    // Update every 30 seconds
    const interval = setInterval(updateSessionInfo, 30000);

    return () => clearInterval(interval);
  }, []);

  // Only render in development
  if (!import.meta.env.DEV || !sessionInfo?.hasSession) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        🔐 Session Active
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 text-sm">
          <div className="font-medium text-gray-900 mb-2">Session Status</div>
          
          <div className="space-y-1 text-gray-600">
            <div>👤 <strong>{sessionInfo.email}</strong> ({sessionInfo.role})</div>
            <div>⏰ Created: {sessionInfo.createdAgo} ago</div>
            <div>⏳ Expires: {sessionInfo.expiresIn}</div>
            <div>🔄 Last activity: {sessionInfo.lastActivityAgo} ago</div>
            
            {sessionInfo.isExpired && (
              <div className="text-red-600 font-medium">❌ Session Expired</div>
            )}
            
            {sessionInfo.isInactive && (
              <div className="text-yellow-600 font-medium">💤 Session Inactive</div>
            )}
            
            {!sessionInfo.isExpired && !sessionInfo.isInactive && (
              <div className="text-green-600 font-medium">✅ Session Active</div>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => {
                sessionManager.extendSession(30);
                setSessionInfo(sessionManager.getSessionInfo());
              }}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              🔄 Extend 30 days
            </button>
            <span className="mx-2 text-gray-400">|</span>
            <button
              onClick={() => console.log('Session info:', sessionInfo)}
              className="text-gray-600 hover:text-gray-800 text-xs"
            >
              📋 Log to console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};