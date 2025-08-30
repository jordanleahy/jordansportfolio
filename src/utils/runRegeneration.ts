import { regenerateAllSystemPrompts } from './regenerateSystemPrompts';

// Global function to run in browser console
(window as any).regenerateSystemPrompts = regenerateAllSystemPrompts;

if (process.env.NODE_ENV === 'development') {
  console.log('🚀 System prompt regeneration utility loaded!');
  console.log('📝 Run this in your browser console: regenerateSystemPrompts()');
}

export { regenerateAllSystemPrompts };