/**
 * Safe Space Configuration for Image Generation
 * Defines aspect-ratio-specific composition rules to prevent edge-touching elements
 * 
 * USER EXPERIENCE:
 * As a user, when I request an aspect ratio image type, this system automatically
 * appends the appropriate composition rules to my prompt, eliminating the need
 * to manually specify safe margins and preventing prompt bloat.
 * 
 * ANTI-BLOAT BENEFITS:
 * - Removes redundant safe space instructions from user prompts and system prompts
 * - Automatically applies aspect-ratio-specific composition rules
 * - Creates single source of truth for safe zone requirements
 * - Ensures consistent margin enforcement across all image generation workflows
 * 
 * WORKFLOW:
 * 1. User provides base prompt with desired aspect ratio
 * 2. System automatically appends safe space rules via appendSafeSpaceRules()
 * 3. Enhanced prompt sent to image generation API with proper composition constraints
 * 4. Generated images respect safe boundaries without manual specification
 * 
 * INTEGRATION POINTS:
 * - create-single-image-prompt: Applied to generated prompts before return
 * - bulk-image-generation: Applied during batch processing
 * - All image generation workflows: Ensures consistent safe space enforcement
 */

export interface SafeSpaceConfig {
  aspectRatio: string;
  description: string;
  safeZones: string;
  composition: string;
  negativePrompts: string;
}

const SAFE_SPACE_CONFIGS: Record<string, SafeSpaceConfig> = {
  '1:1': {
    aspectRatio: '1:1 Square Format',
    description: 'Centered layout with balanced margins on all sides',
    safeZones: 'Maintain balanced 18-20% margins on all sides, especially TOP MARGIN for letter-based content',
    composition: 'Centered layout with generous breathing room from top edge, well-framed central focus',
    negativePrompts: 'No corner-to-corner compositions, maintain balanced spacing, no edge-hugging elements, NEVER allow letters to touch or get close to the top edge, no cramped letter positioning'
  },
  '16:9': {
    aspectRatio: '16:9 Landscape Format',
    description: 'Wide horizontal layout with proper safe boundaries',
    safeZones: 'Maintain 15-20% margins on left and right sides, 10% margins on top and bottom',
    composition: 'Wide horizontal layout with workflow elements well within safe boundaries',
    negativePrompts: 'No cramped horizontal layouts, no elements touching left/right edges, no edge-to-edge content'
  },
  '9:16': {
    aspectRatio: '9:16 Portrait Format',
    description: 'Vertical orientation with generous breathing room',
    safeZones: 'Maintain 12-15% margins on top and bottom, 8-10% margins on left and right sides',
    composition: 'Vertical orientation with generous breathing room',
    negativePrompts: 'No elements touching top/bottom edges, maintain vertical breathing room, no cramped vertical layouts'
  },
  '4:3': {
    aspectRatio: '4:3 Standard Format',
    description: 'Balanced horizontal spacing with proper frame margins',
    safeZones: 'Maintain 12% margins on left and right, 10% margins on top and bottom',
    composition: 'Balanced horizontal spacing with proper frame margins',
    negativePrompts: 'No cramped compositions, no elements touching frame borders, maintain horizontal balance'
  },
  '3:4': {
    aspectRatio: '3:4 Portrait Format',
    description: 'Optimized for social media viewing with proper vertical spacing',
    safeZones: 'Maintain 10-12% margins on top and bottom, 8% margins on left and right sides',
    composition: 'Optimized for social media viewing with proper vertical spacing',
    negativePrompts: 'No elements touching edges, maintain social media safe zones, no cramped vertical content'
  }
};

/**
 * Get safe space rules for a specific aspect ratio
 */
export function getSafeSpaceRules(aspectRatio: string): SafeSpaceConfig {
  // Normalize aspect ratio string
  const normalizedRatio = aspectRatio?.replace(/[\s:]/g, ':').toLowerCase() || '1:1';
  
  // Try exact match first
  if (SAFE_SPACE_CONFIGS[normalizedRatio]) {
    return SAFE_SPACE_CONFIGS[normalizedRatio];
  }
  
  // Try reverse ratio (e.g., 3:4 becomes 4:3)
  const [width, height] = normalizedRatio.split(':');
  const reversedRatio = `${height}:${width}`;
  if (SAFE_SPACE_CONFIGS[reversedRatio]) {
    return SAFE_SPACE_CONFIGS[reversedRatio];
  }
  
  // Default to 1:1 if no match found
  return SAFE_SPACE_CONFIGS['1:1'];
}

/**
 * Detect specific positioning instructions in the original prompt
 */
function detectPositioningInstructions(prompt: string): {
  hasTopPositioning: boolean;
  hasCornerPositioning: boolean;
  hasSpecificPlacement: boolean;
  hasLetterPlacement: boolean;
} {
  const lowerPrompt = prompt.toLowerCase();
  
  return {
    hasTopPositioning: /\b(top|upper|above|place.*top|position.*top)\b/.test(lowerPrompt),
    hasCornerPositioning: /\b(corner|corners|top-left|top-right|bottom-left|bottom-right)\b/.test(lowerPrompt),
    hasSpecificPlacement: /\b(place|position|put|locate).*\b(in|at|on|near)\b/.test(lowerPrompt),
    hasLetterPlacement: /\b(letter|text|character|word).*\b(in|at|on|corner|top|bottom|left|right)\b/.test(lowerPrompt)
  };
}

/**
 * Generate adaptive safe space rules based on prompt content
 */
function getAdaptiveSafeSpaceRules(config: SafeSpaceConfig, positioning: ReturnType<typeof detectPositioningInstructions>): string {
  let safeZones = config.safeZones;
  let composition = config.composition;
  let negativePrompts = config.negativePrompts;

  // If user has specific positioning instructions, adapt the rules
  if (positioning.hasLetterPlacement && positioning.hasTopPositioning) {
    // Soften top margin restrictions for intentional letter placement
    safeZones = safeZones.replace(/TOP MARGIN for letter-based content/g, 'reasonable spacing around text elements');
    negativePrompts = negativePrompts.replace(/NEVER allow letters to touch or get close to the top edge/g, 'maintain readable spacing for text elements');
  }

  if (positioning.hasCornerPositioning) {
    // Allow corner placement but with readable margins
    negativePrompts = negativePrompts.replace(/No corner-to-corner compositions/g, 'ensure adequate margins for corner elements');
    negativePrompts = negativePrompts.replace(/no edge-hugging elements/g, 'provide sufficient spacing from edges');
  }

  if (positioning.hasSpecificPlacement) {
    // Use guidance instead of prohibitions
    composition = `${composition}. Accommodate specific placement requests while maintaining visual balance`;
    negativePrompts = negativePrompts.replace(/no cramped/g, 'avoid overly cramped');
  }

  return `
- Safe Zones: ${safeZones}
- Composition: ${composition}
- Design Guidelines: ${negativePrompts}`;
}

/**
 * Append safe space rules to an image generation prompt
 */
export function appendSafeSpaceRules(originalPrompt: string, aspectRatio: string): string {
  const safeSpaceConfig = getSafeSpaceRules(aspectRatio);
  const positioning = detectPositioningInstructions(originalPrompt);
  
  // Check for potential conflicts
  const hasConflicts = (
    (positioning.hasLetterPlacement && positioning.hasTopPositioning) ||
    positioning.hasCornerPositioning ||
    positioning.hasSpecificPlacement
  );

  let safeSpaceText: string;

  if (hasConflicts) {
    // Use adaptive rules that work with user's intent
    const adaptiveRules = getAdaptiveSafeSpaceRules(safeSpaceConfig, positioning);
    safeSpaceText = `

--- COMPOSITION GUIDELINES ---
${safeSpaceConfig.aspectRatio}:
${adaptiveRules}

These guidelines should enhance the composition while respecting the specific placement instructions above.`;
  } else {
    // Use standard rules for general prompts
    safeSpaceText = `

--- COMPOSITION REQUIREMENTS ---
${safeSpaceConfig.aspectRatio}:
- Safe Zones: ${safeSpaceConfig.safeZones}
- Composition: ${safeSpaceConfig.composition}
- Design Constraints: ${safeSpaceConfig.negativePrompts}

Apply these composition guidelines to create a well-balanced image.`;
  }

  return originalPrompt + safeSpaceText;
}