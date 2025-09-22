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
  textPolicy?: 'none' | 'minimal' | 'allowed';
}

const SAFE_SPACE_CONFIGS: Record<string, SafeSpaceConfig> = {
  '1:1': {
    aspectRatio: '1:1 Square Format',
    description: 'Centered layout with balanced margins on all sides',
    safeZones: 'Maintain balanced 18-20% margins on all sides, especially TOP MARGIN for letter-based content',
    composition: 'Centered layout with generous breathing room from top edge, well-framed central focus',
    negativePrompts: 'avoid corner-to-corner compositions, maintain balanced spacing, avoid edge-hugging elements, avoid letters touching or getting close to the top edge, avoid cramped letter positioning'
  },
  '16:9': {
    aspectRatio: '16:9 Landscape Format',
    description: 'Wide horizontal layout with proper safe boundaries',
    safeZones: 'Maintain 15-20% margins on left and right sides, 10% margins on top and bottom',
    composition: 'Wide horizontal layout with workflow elements well within safe boundaries',
    negativePrompts: 'avoid cramped horizontal layouts, avoid elements touching left/right edges, avoid edge-to-edge content'
  },
  '9:16': {
    aspectRatio: '9:16 Portrait Format',
    description: 'Vertical orientation with generous breathing room',
    safeZones: 'Maintain 12-15% margins on top and bottom, 8-10% margins on left and right sides',
    composition: 'Vertical orientation with generous breathing room',
    negativePrompts: 'avoid elements touching top/bottom edges, maintain vertical breathing room, avoid cramped vertical layouts'
  },
  '4:3': {
    aspectRatio: '4:3 Standard Format',
    description: 'Balanced horizontal spacing with proper frame margins',
    safeZones: 'Maintain 12% margins on left and right, 10% margins on top and bottom',
    composition: 'Balanced horizontal spacing with proper frame margins',
    negativePrompts: 'avoid cramped compositions, avoid elements touching frame borders, maintain horizontal balance'
  },
  '3:4': {
    aspectRatio: '3:4 Portrait Format',
    description: 'Optimized for social media viewing with proper vertical spacing',
    safeZones: 'Maintain 10-12% margins on top and bottom, 8% margins on left and right sides',
    composition: 'Optimized for social media viewing with proper vertical spacing',
    negativePrompts: 'avoid elements touching edges, maintain social media safe zones, avoid cramped vertical content'
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
 * Sanitize aggressive language that might trigger OpenAI's safety system
 */
function sanitizePrompt(prompt: string): string {
  return prompt
    // Replace aggressive imperatives with softer alternatives
    .replace(/\bCRITICAL:\s*/gi, 'Important: ')
    .replace(/\bCRITICAL\b/gi, 'important')
    .replace(/\bMUST\b/gi, 'should')
    .replace(/\bNEVER\b/gi, 'avoid')
    .replace(/\bREQUIRED:\s*/gi, 'Please include: ')
    .replace(/\bDEMAND\b/gi, 'request')
    .replace(/\bINSIST\b/gi, 'prefer')
    .replace(/\bFORBID\b/gi, 'avoid')
    .replace(/\bPROHIBIT\b/gi, 'avoid')
    // Replace command language with collaborative language
    .replace(/\bEnsure that\b/gi, 'Please ensure that')
    .replace(/\bMake sure\b/gi, 'Please make sure')
    .replace(/\bDo not\b/gi, 'Please avoid');
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
    negativePrompts = negativePrompts.replace(/avoid letters touching or getting close to the top edge/g, 'maintain readable spacing for text elements');
  }

  if (positioning.hasCornerPositioning) {
    // Allow corner placement but with readable margins
    negativePrompts = negativePrompts.replace(/avoid corner-to-corner compositions/g, 'ensure adequate margins for corner elements');
    negativePrompts = negativePrompts.replace(/avoid edge-hugging elements/g, 'provide sufficient spacing from edges');
  }

  if (positioning.hasSpecificPlacement) {
    // Use guidance instead of prohibitions
    composition = `${composition}. Accommodate specific placement requests while maintaining visual balance`;
    negativePrompts = negativePrompts.replace(/avoid cramped/g, 'avoid overly cramped');
  }

  return `
- Safe Zones: ${safeZones}
- Composition: ${composition}
- Design Guidelines: ${negativePrompts}`;
}

/**
 * Append safe space rules to an image generation prompt
 */
export function appendSafeSpaceRules(originalPrompt: string, aspectRatio: string, textPolicy?: 'none' | 'minimal' | 'allowed'): string {
  // First sanitize the original prompt to remove aggressive language
  const sanitizedPrompt = sanitizePrompt(originalPrompt);
  
  const safeSpaceConfig = getSafeSpaceRules(aspectRatio);
  const positioning = detectPositioningInstructions(sanitizedPrompt);
  
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

  // Add text exclusion rules if text-free policy is specified
  let textExclusionRules = '';
  if (textPolicy === 'none') {
    textExclusionRules = `

--- TEXT EXCLUSION REQUIREMENTS ---
CRITICAL: This image must contain NO TEXT, NO WORDS, NO LETTERS, NO WRITTEN CONTENT whatsoever.
- Exclude: All text, labels, signage, typography, letterforms, numerical displays
- Exclude: Logos with text, readable content, written characters, symbols that could be interpreted as text
- Focus: Pure visual communication through color, form, composition, lighting, and symbolic imagery
- Use: Abstract representations, visual metaphors, organic shapes, geometric patterns
`;
  } else if (textPolicy === 'minimal') {
    textExclusionRules = `

--- MINIMAL TEXT GUIDELINES ---
- Use text sparingly and only when essential to the concept
- Limit to single words or very short phrases (maximum 1-2 key words)
- Integrate text as design elements, not informational content
- Prioritize visual communication over textual elements
`;
  }

  return sanitizedPrompt + safeSpaceText + textExclusionRules;
}