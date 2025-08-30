/**
 * Debug Controls Utility
 * Provides runtime debug controls accessible from browser console
 */

import { logger } from '@/services/logger';

// Expose debug controls to window object for runtime access
declare global {
  interface Window {
    debugControls: {
      setLogLevel: (level: 'debug' | 'info' | 'warn' | 'error') => void;
      setDebugMode: (enabled: boolean) => void;
      getLogConfig: () => any;
      clearLogs: () => void;
    };
  }
}

// Initialize debug controls
if (typeof window !== 'undefined') {
  window.debugControls = {
    setLogLevel: (level: 'debug' | 'info' | 'warn' | 'error') => {
      logger.setLogLevel(level);
      console.log(`📊 Log level set to: ${level}`);
    },
    
    setDebugMode: (enabled: boolean) => {
      logger.setDebugMode(enabled);
      console.log(`🔧 Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    },
    
    getLogConfig: () => {
      const config = logger.getConfig();
      console.log('📋 Current log configuration:', config);
      return config;
    },
    
    clearLogs: () => {
      console.clear();
      console.log('🧹 Console cleared');
    }
  };

  // Log initialization message
  if (import.meta.env.DEV) {
    console.log(`
🎛️  Debug Controls Available:
• debugControls.setLogLevel('debug'|'info'|'warn'|'error')
• debugControls.setDebugMode(true|false) 
• debugControls.getLogConfig()
• debugControls.clearLogs()

Current config:`, logger.getConfig());
  }
}

export {};