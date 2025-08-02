/**
 * Strips common markdown formatting to create clean, readable text for viewing
 */
export function stripMarkdownFormatting(text: string): string {
  if (!text) return '';

  return text
    // Remove headers (# ## ###) and add proper spacing
    .replace(/^#{1,6}\s+(.+)$/gm, '$1\n')
    // Remove bold and italic markers while keeping the text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    // Remove list markers and format as simple lines
    .replace(/^[-*+]\s+(.+)$/gm, '• $1')
    // Remove numbered list markers
    .replace(/^\d+\.\s+(.+)$/gm, '$1')
    // Clean up multiple consecutive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Clean up extra spaces
    .replace(/[ \t]+/g, ' ')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}
