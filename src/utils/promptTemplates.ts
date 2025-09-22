/**
 * Prompt Template Engine for Image Generation
 * Provides specialized templates for different text policies and visual styles
 */

export type TemplateType = 'text-free' | 'minimal-text' | 'standard';
export type TextPolicy = 'none' | 'minimal' | 'allowed';

interface PromptTemplateConfig {
  templateType: TemplateType;
  textPolicy: TextPolicy;
}

/**
 * Generate a text-free image prompt that explicitly excludes all text elements
 */
export function generateTextFreePrompt(
  title: string, 
  description: string, 
  aspectRatio: string = '1:1'
): string {
  const basePrompt = `Create a purely visual representation of "${title}". ${description}`;
  
  const textFreeEnhancements = [
    'Focus on abstract visual metaphors and symbolic representation',
    'Use color, shape, form, and composition to convey meaning',
    'Incorporate organic flowing forms, geometric patterns, or architectural elements',
    'Emphasize lighting, texture, and atmospheric effects',
    'Create visual hierarchy through scale, contrast, and visual weight',
    'NO TEXT, NO WORDS, NO LETTERS, NO SIGNAGE, NO WRITTEN CONTENT of any kind'
  ];
  
  const negativePrompts = [
    'no text overlays',
    'no labels',
    'no typography',
    'no written characters',
    'no signage',
    'no logos with text',
    'no readable content',
    'no letterforms',
    'no numerical displays'
  ];

  return `${basePrompt}

VISUAL APPROACH:
${textFreeEnhancements.join(', ')}

STRICT TEXT EXCLUSIONS:
${negativePrompts.join(', ')}

Create a compelling visual narrative using only imagery, colors, forms, and composition.`;
}

/**
 * Generate a minimal-text prompt that allows essential text elements only
 */
export function generateMinimalTextPrompt(
  title: string, 
  description: string, 
  aspectRatio: string = '1:1'
): string {
  const basePrompt = `Create a clean, minimal visual for "${title}". ${description}`;
  
  const minimalTextGuidelines = [
    'If text is absolutely necessary, use single words or short phrases only',
    'Prioritize visual communication over textual elements',
    'Text should be integrated as design elements, not informational content',
    'Focus on typography as visual art rather than readable content',
    'Limit to maximum 1-2 key words if essential to the concept'
  ];

  return `${basePrompt}

MINIMAL TEXT GUIDELINES:
${minimalTextGuidelines.join(', ')}

Emphasize visual storytelling with minimal reliance on textual elements.`;
}

/**
 * Generate a standard prompt that allows normal text inclusion
 */
export function generateStandardPrompt(
  title: string, 
  description: string, 
  aspectRatio: string = '1:1'
): string {
  return `Create a professional image for "${title}". ${description}

Use appropriate text, labels, and visual elements as needed to effectively communicate the concept.`;
}

/**
 * Main template engine that routes to appropriate template based on configuration
 */
export function generatePromptFromTemplate(
  title: string,
  description: string,
  config: PromptTemplateConfig,
  aspectRatio: string = '1:1'
): string {
  switch (config.templateType) {
    case 'text-free':
      return generateTextFreePrompt(title, description, aspectRatio);
    case 'minimal-text':
      return generateMinimalTextPrompt(title, description, aspectRatio);
    case 'standard':
    default:
      return generateStandardPrompt(title, description, aspectRatio);
  }
}

/**
 * Get system prompt based on template type for edge functions
 */
export function getSystemPromptForTemplate(templateType: TemplateType = 'standard'): string {
  switch (templateType) {
    case 'text-free':
      return `You are an expert at creating detailed, professional image generation prompts that produce purely visual content without any text, words, letters, or written elements. You specialize in visual metaphors, abstract representations, and symbolic imagery that communicates concepts through pure visual language. Focus on creating prompts that result in images with NO TEXT whatsoever - only colors, shapes, forms, lighting, and composition.`;
    
    case 'minimal-text':
      return `You are an expert at creating clean, minimal image generation prompts that use text sparingly and strategically. When text is included, it should be minimal, purposeful, and integrated as a design element rather than informational content. Prioritize visual communication over textual elements.`;
    
    case 'standard':
    default:
      return `You are an expert at creating detailed, professional image generation prompts for AI image generators. Focus on creating clear, specific prompts that will generate high-quality, professional visuals.`;
  }
}

/**
 * Utility to determine template type from text policy
 */
export function getTemplateTypeFromTextPolicy(textPolicy: TextPolicy): TemplateType {
  switch (textPolicy) {
    case 'none':
      return 'text-free';
    case 'minimal':
      return 'minimal-text';
    case 'allowed':
    default:
      return 'standard';
  }
}