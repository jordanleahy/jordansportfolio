/**
 * Text sanitization utility to convert Unicode text to ASCII-safe format
 * Removes emojis, converts accented characters, and removes special symbols
 */

// Map of common accented characters to their ASCII equivalents
const ACCENT_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
  'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'ÿ': 'y',
  'ñ': 'n', 'ç': 'c',
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
  'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
  'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
  'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
  'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
  'Ý': 'Y', 'Ÿ': 'Y',
  'Ñ': 'N', 'Ç': 'C'
};

/**
 * Sanitizes text by removing emojis, converting accented characters to ASCII,
 * and removing special symbols. Keeps only alphanumeric characters, spaces, and basic punctuation.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  let sanitized = text;
  
  // Convert accented characters to ASCII equivalents
  for (const [accented, ascii] of Object.entries(ACCENT_MAP)) {
    sanitized = sanitized.replace(new RegExp(accented, 'g'), ascii);
  }
  
  // Remove emojis (Unicode ranges for various emoji blocks)
  sanitized = sanitized
    // Basic emoticons and symbols
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    // Miscellaneous symbols and pictographs
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    // Transport and map symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    // Supplemental symbols and pictographs
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '')
    // Geometric shapes extended
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
    // Supplemental arrows C
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
    // Supplemental symbols and pictographs
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    // Chess symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    // Symbols and pictographs extended A
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    // Various other symbol ranges
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '');
  
  // Keep only alphanumeric characters, spaces, and basic punctuation
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.,!?()]/g, '');
  
  // Clean up multiple spaces and trim
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Unicode-safe base64 encoding utility
 */
function safeBase64Encode(text: string): string {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const chars = Array.from(data, byte => String.fromCharCode(byte));
    return btoa(chars.join(''));
  } catch (error) {
    console.warn('Failed to encode text, using fallback:', error);
    return text.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
  }
}

/**
 * Creates a safe cache key from text input by sanitizing and encoding
 */
export function createSafeCacheKey(text: string): string {
  const sanitized = sanitizeText(text);
  return safeBase64Encode(sanitized);
}
