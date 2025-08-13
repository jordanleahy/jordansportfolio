/**
 * TypeScript interfaces for consistent regenerate prompt functionality
 */

export interface RegeneratePromptPayload {
  postId: string;
  themeId?: string;
  aspectRatio?: string;
}

export interface RegeneratePromptResponse {
  generatedPrompt: string;
  category: string;
  correlationId: string;
  usage?: {
    totalCost: number;
    totalTokens: number;
  };
}

export interface RegeneratePromptHook {
  regeneratePrompt: (payload: RegeneratePromptPayload) => Promise<void>;
  isRegenerating: boolean;
  error?: string;
}

/**
 * Validation function to ensure payload format consistency
 */
export function validateRegeneratePayload(payload: any): payload is RegeneratePromptPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.postId === 'string' &&
    payload.postId.trim().length > 0 &&
    (payload.themeId === undefined || typeof payload.themeId === 'string') &&
    (payload.aspectRatio === undefined || typeof payload.aspectRatio === 'string')
  );
}

/**
 * Runtime validation for edge function payload
 */
export function assertValidRegeneratePayload(payload: any): asserts payload is RegeneratePromptPayload {
  if (!validateRegeneratePayload(payload)) {
    throw new Error(
      'Invalid regenerate prompt payload. Expected: { postId: string, themeId?: string, aspectRatio?: string }'
    );
  }
}