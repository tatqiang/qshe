import React, { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Error Boundary caught an error:', error);
    console.error('❌ Error Info:', errorInfo);
    
    // Log additional device info for iOS debugging
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
      isPWA: window.matchMedia && window.matchMedia('(display-mode: standalone)').matches,
      supportsServiceWorker: 'serviceWorker' in navigator,
      windowError: (window as any).__SUPABASE_CONFIG_ERROR__
    };
    
    console.error('🔍 Device Info:', deviceInfo);
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Application Error
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Sorry, something went wrong. This might be a configuration issue.
              </p>
              
              {/* Show specific error for debugging */}
              <div className="bg-gray-50 rounded p-3 mb-4 text-left">
                <p className="text-xs font-mono text-gray-700">
                  {this.state.error?.message || 'Unknown error'}
                </p>
                {(window as any).__SUPABASE_CONFIG_ERROR__ && (
                  <p className="text-xs font-mono text-red-600 mt-2">
                    Config Error: {(window as any).__SUPABASE_CONFIG_ERROR__}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}