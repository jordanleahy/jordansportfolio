# Calendar Theme JSON Processor Agent Documentation

## Agent Overview
**Name:** Calendar Theme JSON Processor  
**Purpose:** Specialized agent for processing, cleaning, and validating calendar theme JSON data using AI-powered analysis and structured validation

## Core Functionality

### Primary Role
- Processes raw theme JSON data for calendar and social media content
- Cleans and validates theme structure and content using AI analysis
- Ensures data integrity and proper formatting for calendar systems
- Provides detailed feedback on fixes, warnings, and errors encountered

### Key Features
1. **AI-Powered Cleaning**: Uses OpenAI to intelligently clean and structure theme data
2. **Comprehensive Validation**: Multi-stage validation of theme fields and content
3. **Error Recovery**: Automatic fixing of common data issues and inconsistencies
4. **Detailed Reporting**: Provides specific feedback on processing actions taken
5. **Structure Standardization**: Ensures consistent theme data format across the system

## Technical Specifications

### Model Configuration
- **Default Model**: `gpt-4o-mini` (Optimized for JSON processing tasks)
- **Temperature**: `0.1` (Focused, deterministic processing)
- **Trigger Type**: API call via edge function or routed from System Prompt Generator
- **Input Source**: Raw JSON theme data from various sources
- **Output Target**: Cleaned, validated theme JSON with processing metadata

### Input Parameters
```typescript
{
  rawJson: any,               // Raw theme data in JSON format
  validation_level?: string,  // Optional validation strictness level
  auto_fix?: boolean,        // Enable automatic fixing of issues
  preserve_structure?: boolean // Maintain original structure where possible
}
```

### Output Structure
```typescript
{
  success: boolean,
  cleaned_data: {
    category: string,
    theme: string,
    posts: Array<{
      day: string,
      title: string,
      description: string,
      status: string,
      hashtags?: string[],
      image_prompt?: string
    }>
  },
  processing_result: {
    fixes: string[],          // List of automatic fixes applied
    warnings: string[],       // Non-critical issues identified
    errors: string[]          // Critical errors that require attention
  },
  metadata: {
    processed_at: string,
    original_structure: boolean,
    validation_score: number
  }
}
```

## Processing Pipeline

### Stage 1: AI-Powered Cleaning
- **Content Analysis**: Analyzes raw JSON structure and identifies issues
- **Intelligent Restructuring**: Reorganizes data into proper theme format
- **Content Enhancement**: Improves descriptions and ensures consistency
- **Format Standardization**: Converts to standard calendar theme schema

### Stage 2: Validation and Quality Assurance
- **Required Fields**: Validates presence of essential theme components
- **Data Types**: Ensures proper data types for all fields
- **Content Quality**: Checks for meaningful titles and descriptions
- **Structure Integrity**: Validates proper nesting and relationships

### Stage 3: Error Handling and Recovery
- **Automatic Fixes**: Applies common fixes for typical data issues
- **Warning Generation**: Identifies potential issues that may need attention
- **Error Classification**: Categorizes critical issues requiring manual intervention
- **Fallback Strategies**: Provides default values for missing critical data

## Theme Data Structure

### Standard Theme Schema
```typescript
{
  category: string,           // Theme category (healthcare, contracts, etc.)
  theme: string,             // Theme name and description
  posts: Array<{
    day: string,             // Day of the calendar (e.g., "Day 1", "Monday")
    title: string,           // Post title
    description: string,     // Post content description
    status: string,          // Post status (draft, published, scheduled)
    hashtags?: string[],     // Optional social media hashtags
    image_prompt?: string,   // Optional image generation prompt
    metadata?: object        // Optional additional metadata
  }>
}
```

### Content Validation Rules
1. **Category Validation**: Must be valid category from predefined list
2. **Theme Consistency**: Theme must be coherent and well-defined
3. **Post Requirements**: Each post must have title, description, and day
4. **Status Values**: Status must be from approved list (draft, published, scheduled)
5. **Content Quality**: Titles and descriptions must be meaningful and substantive

## AI Processing Capabilities

### Content Enhancement
- **Grammar and Style**: Corrects grammar issues and improves readability
- **Consistency**: Ensures consistent tone and style across all posts
- **Completeness**: Fills in missing information where appropriate
- **Optimization**: Enhances content for better engagement and clarity

### Structure Intelligence
- **Format Recognition**: Identifies various input formats and converts appropriately
- **Relationship Mapping**: Understands connections between theme elements
- **Hierarchy Management**: Properly structures nested data relationships
- **Schema Adaptation**: Adapts input data to match required output schema

### Error Intelligence
- **Pattern Recognition**: Identifies common data issues and inconsistencies
- **Context Understanding**: Makes intelligent decisions about ambiguous data
- **Relationship Validation**: Ensures logical connections between data elements
- **Quality Assessment**: Evaluates content quality and completeness

## Validation Framework

### Critical Validations
1. **Required Fields**: category, theme, posts array with essential fields
2. **Data Types**: String validation for text fields, array validation for posts
3. **Content Presence**: Non-empty titles and descriptions
4. **Status Validity**: Approved status values only
5. **Structure Integrity**: Proper JSON structure and nesting

### Quality Checks
- **Content Length**: Appropriate length for titles and descriptions
- **Meaningful Content**: Substantive, non-placeholder content
- **Consistency**: Uniform formatting and style across posts
- **Completeness**: All required information present and valid

### Warning Conditions
- **Optional Fields**: Missing optional but recommended fields
- **Content Quality**: Potentially low-quality or generic content
- **Format Issues**: Minor formatting inconsistencies
- **Optimization Opportunities**: Suggestions for content improvement

## Integration Points

### Database Operations
- **Theme Storage**: Processed themes stored in calendar theme tables
- **Validation Logging**: Processing results and validation outcomes tracked
- **Error Reporting**: Failed processing attempts logged for analysis
- **Quality Metrics**: Success rates and processing statistics maintained

### Calendar System Integration
- **Theme Import**: Seamless integration with calendar theme import workflows
- **Content Validation**: Real-time validation during theme creation and editing
- **Batch Processing**: Support for bulk theme processing and validation
- **Preview Generation**: Processed themes available for preview before import

### User Interface Integration
- **Processing Feedback**: Real-time updates on processing status and results
- **Error Display**: Clear presentation of validation issues and suggested fixes
- **Preview Capabilities**: Visual preview of processed theme data
- **Manual Override**: Options for manual correction of processing results

## Performance Characteristics

### Processing Metrics
- **Average Processing Time**: 5-15 seconds depending on theme complexity
- **Success Rate**: >95% for well-formed input data
- **Error Recovery**: 80% automatic resolution of common issues
- **Quality Improvement**: Measurable enhancement in content quality and consistency

### Optimization Features
- **Caching**: Processed patterns cached for faster repeated processing
- **Batch Optimization**: Efficient processing of multiple themes
- **Incremental Validation**: Fast validation of small changes
- **Performance Monitoring**: Processing time and quality tracking

## Error Management

### Common Issues and Solutions
1. **Malformed JSON**: Automatic structure correction and parsing
2. **Missing Required Fields**: Intelligent field generation and population
3. **Inconsistent Formatting**: Standardization and format correction
4. **Content Quality Issues**: Enhancement and improvement suggestions

### Recovery Strategies
- **Automatic Fixing**: AI-powered resolution of common data issues
- **Fallback Content**: Default values for missing critical information
- **User Guidance**: Clear instructions for resolving manual issues
- **Escalation Paths**: Routing complex issues to appropriate resolution mechanisms

## Monitoring and Analytics

### Key Metrics
- **Processing Success Rate**: Percentage of themes successfully processed
- **Quality Improvement**: Before/after quality score comparisons
- **Error Pattern Analysis**: Common issues and trending problems
- **User Satisfaction**: Feedback on processed theme quality and usability

### Quality Assurance
- **Content Quality Scoring**: Automated assessment of processed content
- **Validation Accuracy**: Correctness of validation and error detection
- **Processing Efficiency**: Time and resource utilization optimization
- **User Experience**: Ease of use and satisfaction with processing results

## Security and Data Protection

### Data Handling
- **Input Sanitization**: Secure processing of user-provided JSON data
- **Content Filtering**: Protection against malicious or inappropriate content
- **Privacy Protection**: Secure handling of user theme data and preferences
- **Access Control**: Appropriate permissions for theme processing operations

### Quality Control
- **Content Validation**: Ensuring appropriate and professional content
- **Data Integrity**: Maintaining accuracy and consistency of processed data
- **Audit Trails**: Complete logging of processing operations and changes
- **Version Control**: Tracking of theme processing history and versions

## Future Enhancements

### Planned Features
- **Advanced AI Models**: Integration of more sophisticated processing capabilities
- **Custom Validation Rules**: User-defined validation criteria and standards
- **Multi-Format Support**: Processing of various input formats beyond JSON
- **Real-Time Collaboration**: Multi-user theme editing and validation

### Technical Improvements
- **Performance Optimization**: Faster processing and improved efficiency
- **Enhanced Error Recovery**: More sophisticated automatic fixing capabilities
- **Quality Enhancement**: Advanced content improvement and optimization
- **Integration Expansion**: Deeper integration with calendar and content management systems