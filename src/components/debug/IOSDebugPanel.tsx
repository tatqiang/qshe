import React, { useState, useEffect } from 'react';
import IOSPWADebugger from '../../utils/iosPwaDebugger';

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const IOSDebugPanel: React.FC<DebugPanelProps> = ({ isVisible, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      const iosDebugger = IOSPWADebugger.getInstance();
      setDebugInfo(iosDebugger.getDebugInfo());
    }
  }, [isVisible]);

  if (!isVisible || !debugInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">iOS PWA Debug Info</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3 text-sm">
          <div>
            <strong>Device:</strong> {debugInfo.isIOS ? '📱 iOS' : '💻 Other'} 
            {debugInfo.isSafari ? ' Safari' : ' Other Browser'}
          </div>
          
          <div>
            <strong>PWA Mode:</strong> {debugInfo.isPWA || debugInfo.isStandalone ? '✅ Yes' : '❌ No'}
          </div>
          
          <div>
            <strong>Viewport:</strong> {debugInfo.viewportWidth}x{debugInfo.viewportHeight}
          </div>
          
          <div>
            <strong>Environment:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Supabase URL: {debugInfo.envVarsStatus.supabaseUrl ? '✅' : '❌'}</li>
              <li>Supabase Key: {debugInfo.envVarsStatus.supabaseKey ? '✅' : '❌'}</li>
              <li>Service Worker: {debugInfo.hasServiceWorker ? '✅' : '❌'}</li>
            </ul>
          </div>
          
          <div>
            <strong>User Agent:</strong>
            <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
              {debugInfo.userAgent}
            </div>
          </div>
          
          {debugInfo.errors.length > 0 && (
            <div>
              <strong className="text-red-600">Errors:</strong>
              <ul className="list-disc list-inside ml-4 text-red-600 text-xs">
                {debugInfo.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {debugInfo.warnings.length > 0 && (
            <div>
              <strong className="text-yellow-600">Warnings:</strong>
              <ul className="list-disc list-inside ml-4 text-yellow-600 text-xs">
                {debugInfo.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Check if Supabase config error exists */}
          {(window as any).__SUPABASE_CONFIG_ERROR__ && (
            <div>
              <strong className="text-red-600">Config Error:</strong>
              <div className="text-xs font-mono bg-red-50 p-2 rounded text-red-700">
                {(window as any).__SUPABASE_CONFIG_ERROR__}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 space-y-2">
          <button
            onClick={() => {
              console.log('🔄 Reloading page...');
              window.location.reload();
            }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
          
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              console.log('🗑️ Cleared storage, reloading...');
              window.location.reload();
            }}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Clear Storage & Reload
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Triple-tap detector for iOS
export const useTripleTapDebug = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleTap = () => {
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }

      const newCount = tapCount + 1;
      setTapCount(newCount);

      if (newCount === 3) {
        setShowDebug(true);
        setTapCount(0);
      } else {
        const timeout = setTimeout(() => {
          setTapCount(0);
        }, 500); // Reset after 500ms
        setTapTimeout(timeout);
      }
    };

    // Only enable on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      document.addEventListener('touchend', handleTap);
      // Also listen for clicks for testing
      document.addEventListener('click', handleTap);
    }

    return () => {
      document.removeEventListener('touchend', handleTap);
      document.removeEventListener('click', handleTap);
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }
    };
  }, [tapCount, tapTimeout]);

  return {
    showDebug,
    setShowDebug
  };
};