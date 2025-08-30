import { regenerateAllSystemPrompts } from './regenerateSystemPrompts';

// Global function to run in browser console
(window as any).regenerateSystemPrompts = regenerateAllSystemPrompts;

console.log('🚀 System prompt regeneration utility loaded!');
console.log('📝 Run this in your browser console: regenerateSystemPrompts()');

export { regenerateAllSystemPrompts };