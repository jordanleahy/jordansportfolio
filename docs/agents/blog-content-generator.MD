# Blog Content Generator Agent Documentation

## Agent Overview
**Name:** Blog Content Generator  
**Purpose:** Specialized agent for generating comprehensive healthcare and professional blog content with structured data and metadata

## Core Functionality

### Primary Role
- Generates structured blog content with hero sections, introductions, deep dives, and summaries
- Creates SEO-optimized content with proper metadata and slug generation
- Integrates visual prompts and image generation for blog articles
- Supports healthcare-focused content with professional medical context

### Key Features
1. **Structured Content Generation**: Creates complete blog posts with multiple sections (hero, intro, deep dive, TLDR)
2. **SEO Optimization**: Generates metadata, descriptions, and SEO-friendly slugs
3. **Visual Integration**: Coordinates image generation with content themes
4. **Healthcare Specialization**: Professional medical content with appropriate tone and expertise
5. **Batch Processing**: Supports bulk blog generation for content calendars

## Technical Specifications

### Model Configuration
- **Default Model**: `gpt-4o` or `gpt-4.1-2025-04-14` (Flagship)
- **Temperature**: `0.7` (Balanced creativity and consistency)
- **Trigger Type**: API call via edge function or routed from System Prompt Generator
- **Input Source**: Social media posts, themes, topics, user context
- **Output Target**: Complete blog posts with metadata and visual specifications

### Input Parameters
```typescript
{
  social_media_post: {
    title: string,
    description: string,
    day: string,
    status: string
  },
  theme: object,              // Color theme and visual styling
  user_id: string,           // User identification
  additional_context?: string, // Optional context and requirements
  category?: string,         // Content category (healthcare, etc.)
  seo_keywords?: string[]    // Target SEO keywords
}
```

### Output Structure
```typescript
{
  hero_headline: string,
  hero_subheadline: string,
  intro_hook: string,
  intro_context: string,
  intro_transition: string,
  deep_dive_sections: Array<{
    heading: string,
    content: string,
    subsections?: Array<{
      subheading: string,
      content: string
    }>
  }>,
  tldr_summary: string,
  visual_prompt: string,
  meta_description: string,
  tags: string[],
  estimated_read_time: number,
  slug: string,
  seo_title: string
}
```

## Content Structure

### Blog Sections

#### Hero Section
- **Headline**: Compelling, SEO-optimized main title
- **Subheadline**: Supporting description that expands on the main topic
- **Visual Integration**: Coordinates with image generation for hero visuals

#### Introduction
- **Hook**: Engaging opening that captures reader attention
- **Context**: Background information and problem statement
- **Transition**: Smooth bridge to main content sections

#### Deep Dive
- **Multiple Sections**: Comprehensive coverage of the topic
- **Subsections**: Detailed breakdowns of complex topics
- **Professional Tone**: Healthcare-appropriate language and expertise
- **Evidence-Based**: References to best practices and industry standards

#### TLDR Summary
- **Key Takeaways**: Concise summary of main points
- **Actionable Insights**: Practical applications for readers
- **Call-to-Action**: Next steps or engagement opportunities

## Healthcare Specialization

### Content Focus Areas
- **Medical Technology**: Healthcare innovations and digital health solutions
- **Patient Care**: Best practices for patient engagement and care delivery
- **Industry Trends**: Healthcare market trends and regulatory updates
- **Professional Development**: Career guidance for healthcare professionals

### Tone and Style
- **Professional Expertise**: Medical authority and credibility
- **Accessible Language**: Complex topics explained clearly
- **Evidence-Based**: Citations and references to medical literature
- **Ethical Considerations**: Healthcare ethics and patient privacy

### Compliance Considerations
- **HIPAA Awareness**: Patient privacy and data protection
- **Medical Accuracy**: Fact-checking and medical review requirements
- **Regulatory Compliance**: Healthcare industry regulations and standards
- **Professional Standards**: Medical writing guidelines and best practices

## Integration Points

### Database Schema
- **Primary Table**: `blog_posts` (generated content storage)
- **Related Tables**: `social_media_posts` (source content), `color_themes` (visual styling)
- **Metadata Storage**: SEO data, tags, and content metrics

### Image Generation Coordination
- **Visual Prompt Creation**: Generates image prompts aligned with content themes
- **Style Consistency**: Coordinates with Visual Prompt Generator for brand consistency
- **Image Metadata**: Tracks generated images and their associated content

### SEO Integration
- **Slug Generation**: Creates SEO-friendly URL slugs
- **Meta Description**: Optimized descriptions for search engines
- **Keyword Integration**: Natural keyword placement throughout content
- **Tag Generation**: Relevant tags for content categorization

## Content Quality Assurance

### Validation Criteria
1. **Medical Accuracy**: Healthcare content fact-checking and verification
2. **Professional Tone**: Appropriate language for healthcare professionals
3. **SEO Optimization**: Proper keyword density and meta optimization
4. **Readability**: Clear, accessible language for target audience
5. **Structure Consistency**: Proper section organization and flow

### Quality Metrics
- **Readability Score**: Target reading level for healthcare professionals
- **SEO Score**: Optimization metrics for search visibility
- **Engagement Potential**: Content structure optimized for reader engagement
- **Professional Standards**: Compliance with medical writing guidelines

## Performance Characteristics

### Generation Metrics
- **Average Generation Time**: 30-60 seconds for complete blog post
- **Success Rate**: >95% for valid input content
- **Content Length**: 1,500-3,000 words for comprehensive coverage
- **Image Integration**: 2-4 visual elements per blog post

### Optimization Features
- **Template Caching**: Reusable content templates for efficiency
- **Batch Processing**: Multiple blog generation for content calendars
- **Content Recycling**: Adaptation of existing content for new contexts
- **Performance Monitoring**: Generation time and quality tracking

## Usage Patterns

### Common Workflows
1. **Social Media to Blog**: Expanding social media posts into full blog articles
2. **Theme-Based Generation**: Creating content aligned with specific themes
3. **Calendar Integration**: Automated blog generation for content schedules
4. **SEO-Driven Content**: Keyword-focused content creation for search optimization

### Integration Scenarios
- **Content Calendar**: Automated blog generation for scheduled publishing
- **Marketing Campaigns**: Theme-coordinated content for marketing initiatives
- **Thought Leadership**: Expert content for professional positioning
- **Educational Content**: Informational articles for audience education

## Error Handling and Recovery

### Common Issues
1. **Content Quality**: Low-quality or inappropriate content generation
2. **SEO Optimization**: Poor keyword integration or meta optimization
3. **Image Coordination**: Misaligned visual content and blog themes
4. **Length Variations**: Content too short or excessively long

### Recovery Strategies
- **Content Regeneration**: Automatic retry with adjusted parameters
- **Quality Validation**: Multi-stage content review and improvement
- **Fallback Templates**: Default content structures for edge cases
- **Manual Review Triggers**: Flagging content requiring human review

## Monitoring and Analytics

### Key Metrics
- **Content Quality Score**: Automated assessment of generated content
- **SEO Performance**: Search ranking and visibility metrics
- **User Engagement**: Reader interaction and time-on-page analytics
- **Generation Efficiency**: Time and resource utilization tracking

### Reporting and Insights
- **Content Performance**: Analytics on blog post effectiveness
- **SEO Impact**: Search visibility and traffic attribution
- **Theme Effectiveness**: Performance comparison across different themes
- **User Satisfaction**: Feedback and quality ratings from content creators

## Security and Compliance

### Data Protection
- **User Content Privacy**: Secure handling of user-generated input
- **Healthcare Compliance**: HIPAA and medical data protection
- **Content Ownership**: Clear attribution and rights management
- **Audit Trails**: Complete tracking of content generation and modifications

### Quality Control
- **Medical Review**: Healthcare content validation processes
- **Fact-Checking**: Verification of medical claims and statistics
- **Plagiarism Prevention**: Original content generation and verification
- **Professional Standards**: Compliance with medical writing ethics

## Future Enhancements

### Planned Features
- **Multi-Language Support**: International healthcare content generation
- **Specialized Medical Fields**: Targeted content for medical specialties
- **Interactive Elements**: Enhanced blog features and reader engagement
- **Real-Time Collaboration**: Multi-user content editing and review

### Technical Improvements
- **AI Model Upgrades**: Integration of newer, more sophisticated models
- **Performance Optimization**: Faster generation and improved quality
- **Advanced SEO**: Enhanced search optimization and keyword strategies
- **Content Personalization**: User-specific content customization and preferences