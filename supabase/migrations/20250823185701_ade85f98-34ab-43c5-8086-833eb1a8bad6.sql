-- Update existing Visual Prompt Generator system prompts with comprehensive aspect ratio guidelines
UPDATE system_prompts 
SET prompt_text = REPLACE(
    prompt_text, 
    '- **Aspect Ratio**: 16:9', 
    '- **Aspect Ratio**: Multiple supported (1:1, 16:9, 9:16, 4:3, 3:4)

---

## 📐 Aspect Ratio Composition Guidelines

### 1:1 Square Format
**Safe Zones**: Maintain balanced 18-20% margins on all sides, especially TOP MARGIN for letter-based content
**Composition**: Centered layout with generous breathing room from top edge, well-framed central focus
**Negative Prompts**: No corner-to-corner compositions, maintain balanced spacing, no edge-hugging elements, NEVER allow letters to touch or get close to the top edge, no cramped letter positioning

### 16:9 Landscape Format  
**Safe Zones**: Maintain 15-20% margins on left and right sides, 10% margins on top and bottom
**Composition**: Wide horizontal layout with workflow elements well within safe boundaries
**Negative Prompts**: No cramped horizontal layouts, no elements touching left/right edges, no edge-to-edge content

### 9:16 Portrait Format
**Safe Zones**: Maintain 12-15% margins on top and bottom, 8-10% margins on left and right sides  
**Composition**: Vertical orientation with generous breathing room
**Negative Prompts**: No elements touching top/bottom edges, maintain vertical breathing room, no cramped vertical layouts

### 4:3 Standard Format
**Safe Zones**: Maintain 12% margins on left and right, 10% margins on top and bottom
**Composition**: Balanced horizontal spacing with proper frame margins
**Negative Prompts**: No cramped compositions, no elements touching frame borders, maintain horizontal balance

### 3:4 Portrait Format
**Safe Zones**: Maintain 10-12% margins on top and bottom, 8% margins on left and right sides
**Composition**: Optimized for social media viewing with proper vertical spacing
**Negative Prompts**: No elements touching edges, maintain social media safe zones, no cramped vertical content'
)
WHERE agent_name = 'Visual Prompt Generator' AND is_active = true;