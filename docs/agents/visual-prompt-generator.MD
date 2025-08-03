# Visual Prompt Generator Agent Documentation

## Agent Overview
**Name:** Visual Prompt Generator  
**Purpose:** Specialized agent for generating detailed image prompts optimized for AI image generation across various professional categories

## Core Functionality

### Primary Role
- Creates professional, detailed image generation prompts
- Optimizes prompts for vector illustration style and modern design
- Ensures proper aspect ratio specification and visual consistency
- Supports multiple professional categories (healthcare, contracts, design, AI, product roles)

### Key Features
1. **Category Specialization**: Tailored prompts for healthcare, contracts, design, and product management content
2. **Visual Style Consistency**: Maintains consistent vector illustration style with clean, modern aesthetics
3. **Professional Color Palettes**: Integrates appropriate color schemes for each professional domain
4. **Aspect Ratio Management**: Automatically specifies optimal aspect ratios for different use cases
5. **Quality Optimization**: Ensures high-quality, professional visual output suitable for business contexts

## Technical Specifications

### Model Configuration
- **Default Model**: `gpt-4.1-2025-04-14` (Flagship)
- **Temperature**: `0.1` (Focused, consistent outputs)
- **Trigger Type**: Routed from System Prompt Generator
- **Input Source**: Category-specific context and requirements
- **Output Target**: Image generation prompts for visual content creation

### Input Parameters
```typescript
{
  category: string,           // Target professional category
  context: string,           // Content context and requirements
  style_preferences?: string, // Optional visual style overrides
  aspect_ratio?: string,     // Target aspect ratio (e.g., "16:9", "1:1")
  color_theme?: object      // Color palette and theme information
}
```

### Output Structure
```typescript
{
  image_prompt: string,      // Detailed image generation prompt
  style_specifications: {
    aspect_ratio: string,
    color_palette: string[],
    visual_style: string,
    quality_level: string
  },
  category_context: string,
  metadata: {
    generated_at: string,
    model_version: string,
    category: string
  }
}
```

## Category Specializations

### Healthcare
- **Visual Style**: Clean, professional medical illustrations
- **Color Scheme**: Medical blues, calming greens, professional whites
- **Content Focus**: Medical devices, healthcare scenarios, patient care
- **Aspect Ratios**: Typically 16:9 for presentations, 1:1 for social media

### Contracts & Legal
- **Visual Style**: Professional business illustrations, document graphics
- **Color Scheme**: Corporate blues, neutral grays, trust-building colors
- **Content Focus**: Legal documents, handshakes, professional meetings
- **Aspect Ratios**: 16:9 for presentations, 4:3 for reports

### Design & Creative
- **Visual Style**: Modern design elements, creative compositions
- **Color Scheme**: Dynamic color palettes, design-forward schemes
- **Content Focus**: Design tools, creative processes, artistic elements
- **Aspect Ratios**: Various ratios depending on design requirements

### Product Management
- **Visual Style**: Technology-focused, innovation-oriented graphics
- **Color Scheme**: Tech-forward colors, modern digital palettes
- **Content Focus**: Product development, technology interfaces, data visualization
- **Aspect Ratios**: 16:9 for presentations, square for social platforms

## Integration Points

### System Prompt Generator
- Receives routing from System Prompt Generator based on category
- Inherits color themes and context from parent agent
- Updates system prompts with generated visual specifications

### Database Schema
- **Primary Table**: `system_prompts` (for generated prompts)
- **Agent Management**: `openai_agents` (agent configuration)
- **Color Integration**: `color_themes` (visual style coordination)

### Frontend Components
- Image generation interfaces in calendar and content management
- Visual prompt preview and editing capabilities
- Style customization controls for different categories

## Prompt Generation Strategy

### Template Structure
```
Base Template: "You are an expert at creating detailed, professional image generation prompts for {category}-themed AI image generators..."

Style Guidelines:
- Vector illustration style with clean, modern design
- Professional color palette appropriate for {category}
- Aspect ratio specification: {aspect_ratio}
- High-quality, business-appropriate visual elements
```

### Quality Assurance
1. **Consistency Checks**: Ensures prompts maintain visual consistency across category
2. **Professional Standards**: Validates appropriateness for business contexts
3. **Technical Specifications**: Verifies aspect ratio and quality parameters
4. **Style Coherence**: Maintains brand and visual style guidelines

## Performance Characteristics

### Response Metrics
- **Average Generation Time**: 1-3 seconds for prompt creation
- **Success Rate**: >98% for valid category inputs
- **Cache Hit Rate**: 85% for repeated category/context combinations
- **Quality Score**: Professional-grade output validation

### Optimization Features
- **Prompt Caching**: Stores frequently used prompt patterns
- **Category Templates**: Pre-optimized templates for each professional domain
- **Style Inheritance**: Reuses successful visual patterns
- **Performance Monitoring**: Tracks generation quality and user satisfaction

## Usage Patterns

### Common Workflows
1. **Blog Content**: Generate hero images and article illustrations
2. **Social Media**: Create category-specific social media visuals
3. **Presentations**: Generate professional slide graphics and diagrams
4. **Marketing Materials**: Create branded visual content for campaigns

### Integration Points
- **Calendar Posts**: Automated image generation for scheduled content
- **Blog Editor**: Real-time visual prompt generation during content creation
- **Theme Import**: Bulk image generation for imported content themes
- **Custom Requests**: Ad-hoc visual content generation

## Quality Control

### Validation Criteria
1. **Professional Appropriateness**: Suitable for business and professional contexts
2. **Visual Consistency**: Maintains brand and style guidelines
3. **Technical Accuracy**: Proper aspect ratios and quality specifications
4. **Category Relevance**: Appropriate for target professional domain

### Error Handling
- **Invalid Categories**: Fallback to general professional style
- **Missing Context**: Use category defaults with professional styling
- **Style Conflicts**: Priority system for resolving conflicting requirements
- **Quality Failures**: Automatic retry with adjusted parameters

## Monitoring and Maintenance

### Key Metrics
- **Generation Success Rate**: Target >98%
- **User Satisfaction**: Visual quality ratings and usage patterns
- **Category Performance**: Success rates by professional domain
- **Style Consistency**: Visual coherence across generated content

### Maintenance Tasks
- **Monthly**: Review and update category templates
- **Quarterly**: Analyze visual quality trends and user feedback
- **Bi-annually**: Update professional style guidelines and color palettes
- **Annually**: Comprehensive category specialization review

## Security and Compliance

### Content Safety
- **Professional Standards**: Ensures all generated content meets business appropriateness
- **Brand Compliance**: Maintains visual brand guidelines and standards
- **Quality Control**: Validates output against professional design criteria
- **User Privacy**: Protects user-specific visual preferences and data

### Access Control
- User-scoped prompt access and customization
- Professional category permissions and restrictions
- Visual style template protection and versioning
- Audit trails for generated visual content

## Future Enhancements

### Planned Features
- **Advanced Style Transfer**: Custom brand style integration
- **Multi-Modal Generation**: Text and visual prompt coordination
- **A/B Testing**: Visual style effectiveness testing
- **Real-time Customization**: Interactive prompt refinement

### Technical Improvements
- **Performance Optimization**: Faster prompt generation and caching
- **Quality Enhancement**: Advanced visual quality validation
- **Category Expansion**: Additional professional domains and specializations
- **Integration Enhancement**: Deeper calendar and content management integration