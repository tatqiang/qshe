/**
 * iOS Safari PWA Debug Helper
 * Helps diagnose blank page issues on iOS Safari
 */

interface IOSDebugInfo {
  userAgent: string;
  isIOS: boolean;
  isSafari: boolean;
  isPWA: boolean;
  isStandalone: boolean;
  viewportWidth: number;
  viewportHeight: number;
  hasServiceWorker: boolean;
  envVarsStatus: {
    supabaseUrl: boolean;
    supabaseKey: boolean;
  };
  errors: string[];
  warnings: string[];
}

class IOSPWADebugger {
  private static instance: IOSPWADebugger;
  private errors: string[] = [];
  private warnings: string[] = [];

  static getInstance(): IOSPWADebugger {
    if (!IOSPWADebugger.instance) {
      IOSPWADebugger.instance = new IOSPWADebugger();
    }
    return IOSPWADebugger.instance;
  }

  constructor() {
    this.init();
  }

  private init() {
    // Capture early errors
    window.addEventListener('error', (event) => {
      this.addError(`JS Error: ${event.message} at ${event.filename}:${event.lineno}`);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addError(`Promise Rejection: ${event.reason}`);
    });

    // Log initial status
    console.log('🔍 iOS PWA Debugger initialized');
    this.logDebugInfo();
  }

  addError(error: string) {
    this.errors.push(error);
    console.error('❌ iOS PWA Error:', error);
  }

  addWarning(warning: string) {
    this.warnings.push(warning);
    console.warn('⚠️ iOS PWA Warning:', warning);
  }

  getDebugInfo(): IOSDebugInfo {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isPWA = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isStandalone = (window.navigator as any).standalone === true;

    return {
      userAgent: ua,
      isIOS,
      isSafari,
      isPWA,
      isStandalone,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      hasServiceWorker: 'serviceWorker' in navigator,
      envVarsStatus: {
        supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  logDebugInfo() {
    const info = this.getDebugInfo();
    
    console.log('📱 Device Info:', {
      isIOS: info.isIOS,
      isSafari: info.isSafari,
      isPWA: info.isPWA,
      isStandalone: info.isStandalone,
      viewport: `${info.viewportWidth}x${info.viewportHeight}`
    });

    console.log('🔧 Environment:', {
      mode: import.meta.env.MODE,
      hasSupabaseUrl: info.envVarsStatus.supabaseUrl,
      hasSupabaseKey: info.envVarsStatus.supabaseKey,
      hasServiceWorker: info.hasServiceWorker
    });

    if (info.errors.length > 0) {
      console.error('❌ Errors detected:', info.errors);
    }

    if (info.warnings.length > 0) {
      console.warn('⚠️ Warnings:', info.warnings);
    }

    // iOS Safari specific checks
    if (info.isIOS && info.isSafari) {
      this.performIOSChecks();
    }
  }

  private performIOSChecks() {
    // Check for common iOS Safari issues
    
    // 1. Check if environment variables are missing
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      this.addError('Missing required environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
    }

    // 2. Check viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      this.addWarning('Missing viewport meta tag');
    } else {
      const content = viewportMeta.getAttribute('content') || '';
      if (!content.includes('user-scalable=no')) {
        this.addWarning('Viewport meta tag might need user-scalable=no for iOS');
      }
    }

    // 3. Check for PWA meta tags
    const appleMobileWebApp = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleMobileWebApp) {
      this.addWarning('Missing apple-mobile-web-app-capable meta tag');
    }

    // 4. Check if running as PWA
    const isStandalone = (window.navigator as any).standalone;
    const isPWA = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone || isPWA) {
      console.log('✅ Running as PWA');
    } else {
      console.log('ℹ️ Running in browser mode');
    }

    // 5. Check for manifest
    const manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) {
      this.addWarning('Missing manifest link');
    }
  }

  // Call this method to display debug info in UI for user
  createDebugModal(): HTMLElement {
    const info = this.getDebugInfo();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">iOS PWA Debug Info</h3>
        
        <div class="space-y-3 text-sm">
          <div>
            <strong>Device:</strong> ${info.isIOS ? '📱 iOS' : '💻 Other'} 
            ${info.isSafari ? 'Safari' : 'Other Browser'}
          </div>
          
          <div>
            <strong>PWA Mode:</strong> ${info.isPWA || info.isStandalone ? '✅ Yes' : '❌ No'}
          </div>
          
          <div>
            <strong>Viewport:</strong> ${info.viewportWidth}x${info.viewportHeight}
          </div>
          
          <div>
            <strong>Environment:</strong>
            <ul class="list-disc list-inside ml-4">
              <li>Supabase URL: ${info.envVarsStatus.supabaseUrl ? '✅' : '❌'}</li>
              <li>Supabase Key: ${info.envVarsStatus.supabaseKey ? '✅' : '❌'}</li>
              <li>Service Worker: ${info.hasServiceWorker ? '✅' : '❌'}</li>
            </ul>
          </div>
          
          ${info.errors.length > 0 ? `
            <div>
              <strong class="text-red-600">Errors:</strong>
              <ul class="list-disc list-inside ml-4 text-red-600">
                ${info.errors.map(error => `<li>${error}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${info.warnings.length > 0 ? `
            <div>
              <strong class="text-yellow-600">Warnings:</strong>
              <ul class="list-disc list-inside ml-4 text-yellow-600">
                ${info.warnings.map(warning => `<li>${warning}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        
        <button 
          onclick="this.parentElement.parentElement.remove()" 
          class="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    `;
    
    return modal;
  }
}

// Initialize debugger
const iosDebugger = IOSPWADebugger.getInstance();

// Export for global access
(window as any).IOSPWADebugger = iosDebugger;

export default IOSPWADebugger;