import { AGENT_NAMES } from '@/constants/agentConstants';

/**
 * Utility functions for consistent agent name usage across the application
 * This replaces hardcoded agent names with centralized constants
 */

/**
 * Get the Visual Prompt Generator agent name
 * Replaces hardcoded 'Visual Prompt Generator' strings
 */
export const getVisualPromptGeneratorName = (): string => {
  return AGENT_NAMES.VISUAL_PROMPT_GENERATOR;
};

/**
 * Get the System Prompt Generator agent name
 */
export const getSystemPromptGeneratorName = (): string => {
  return AGENT_NAMES.SYSTEM_PROMPT_GENERATOR;
};

/**
 * Get the Blog Content Generator agent name
 */
export const getBlogContentGeneratorName = (): string => {
  return AGENT_NAMES.BLOG_CONTENT_GENERATOR;
};

/**
 * Get the Cover Letter Generator agent name
 */
export const getCoverLetterGeneratorName = (): string => {
  return AGENT_NAMES.COVER_LETTER_GENERATOR;
};

/**
 * Get the Story Telling Agent name
 */
export const getStoryTellingAgentName = (): string => {
  return AGENT_NAMES.STORY_TELLING_AGENT;
};

/**
 * Check if an agent name matches the Visual Prompt Generator
 * @param agentName - The agent name to check
 * @returns true if the name matches the Visual Prompt Generator
 */
export const isVisualPromptGenerator = (agentName: string): boolean => {
  return agentName === AGENT_NAMES.VISUAL_PROMPT_GENERATOR;
};

/**
 * Get all available agent names as an array
 */
export const getAllAgentNames = (): string[] => {
  return Object.values(AGENT_NAMES);
};

/**
 * Find agent name by partial match (case-insensitive)
 * Useful for legacy code migration
 * @param partialName - Part of the agent name to search for
 * @returns The full agent name or null if not found
 */
export const findAgentNameByPartial = (partialName: string): string | null => {
  const lowerPartial = partialName.toLowerCase();
  const found = Object.values(AGENT_NAMES).find(name => 
    name.toLowerCase().includes(lowerPartial)
  );
  return found || null;
};