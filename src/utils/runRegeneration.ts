import { regenerateAllSystemPrompts } from './regenerateSystemPrompts';
import { recoverAllMissingSystemPrompts, checkSystemPromptHealth } from './systemPromptRecovery';

// Global function to run in browser console
(window as any).regenerateSystemPrompts = regenerateAllSystemPrompts;
(window as any).recoverMissingSystemPrompts = recoverAllMissingSystemPrompts;
(window as any).checkSystemPromptHealth = checkSystemPromptHealth;

console.log('🚀 System prompt regeneration utility loaded!');
console.log('📝 Available commands:');
console.log('  - regenerateSystemPrompts() - Regenerate all missing system prompts');
console.log('  - recoverMissingSystemPrompts() - Recover system prompts for failed themes');
console.log('  - checkSystemPromptHealth() - Check overall system prompt health');

export { regenerateAllSystemPrompts, recoverAllMissingSystemPrompts, checkSystemPromptHealth };