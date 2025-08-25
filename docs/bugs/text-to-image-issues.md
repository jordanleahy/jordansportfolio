# Text-to-Image Creation - Current Bug Documentation

## Critical Issues

### 1. Visual Prompt Generator Function Failures
**Status:** 🔴 Critical
**Affected Function:** `visual-prompt-generator`
**Error:** All requests returning 400 Bad Request
**Impact:** Complete failure of image prompt generation for all posts

**Details:**
- All 7 posts in level-5-leadership category failed prompt generation
- Function starts correctly but fails during OpenAI API calls
- Error: "Edge Function returned a non-2xx status code"

**Root Cause:** Parameter mismatch between calling functions and expected payload

### 2. Database Schema Issues
**Status:** 🟡 Resolved but Monitoring
**Affected Table:** `system_prompts`
**Error:** `column system_prompts.category does not exist`
**Impact:** System prompt polling failures

**Details:**
- DB poll errors while checking system_prompts table
- Caused fallback to timeout behavior in system prompt generation
- May affect prompt caching and retrieval

### 3. OpenAI Model Version Inconsistencies
**Status:** 🟡 Partially Fixed
**Affected Functions:** Multiple edge functions
**Error:** Invalid model names in API calls
**Impact:** API failures and timeouts

**Details:**
- Some functions using incorrect model names (e.g., `gpt-5-mini` instead of `gpt-5-mini-2025-08-07`)
- Recently fixed in `invoke-system-prompt-agent` but may exist in other functions
- Database `openai_agents` table also had incorrect model versions

### 4. Function Parameter Mismatches
**Status:** 🟡 Recently Fixed
**Affected Functions:** `ensure-post-image-prompts` ↔ `visual-prompt-generator`
**Error:** Payload structure differences
**Impact:** All image prompt generation failures

**Details:**
- `ensure-post-image-prompts` was sending incorrect payload structure
- Expected: `{category, context, theme, description, aspect_ratio}`
- Was sending: `{category, context, themeId, description}`
- Response field mapping was also incorrect (`image_prompt` vs `generatedPrompt`)

## Performance Issues

### 5. System Prompt Generation Timeouts
**Status:** 🟡 Ongoing
**Affected Function:** `user-idea-streaming-image-pipeline`
**Error:** Soft timeouts during system prompt generation
**Impact:** Pipeline delays and fallback behaviors

**Details:**
- 3 retry attempts with 8-second delays
- Function continues gracefully but with reduced functionality
- May indicate underlying OpenAI API latency issues

### 6. Concurrent Function Instance Management
**Status:** 🟡 Monitoring
**Affected Function:** `visual-prompt-generator`
**Error:** Multiple simultaneous shutdowns
**Impact:** Resource inefficiency

**Details:**
- Multiple function instances spinning up and shutting down rapidly
- May indicate connection pooling or concurrency control issues
- Could affect response times and resource usage

## Integration Issues

### 7. Edge Function Communication Failures
**Status:** 🔴 Active
**Affected Flow:** `ensure-post-image-prompts` → `visual-prompt-generator`
**Error:** FunctionsHttpError with 400 status
**Impact:** Complete breakdown of image generation pipeline

**Details:**
- All 7 posts failed during parallel prompt generation
- Function invocation returns non-2xx status codes
- Error propagates through entire batch processing

### 8. Theme System Integration
**Status:** 🟡 Monitoring
**Affected Component:** Theme-based prompt generation
**Error:** Theme ID handling inconsistencies
**Impact:** Reduced prompt quality and caching effectiveness

**Details:**
- Theme ID parameter naming inconsistencies across functions
- May affect prompt customization based on user themes
- Could impact caching strategies

## Data Quality Issues

### 9. Missing Image Prompts in Database
**Status:** 🔴 Widespread
**Affected Data:** Social media posts
**Error:** Posts without `generated_image_prompt` field populated
**Impact:** Unable to generate images for existing content

**Details:**
- 7 posts in level-5-leadership category missing prompts
- Likely affects other categories as well
- Requires bulk regeneration of prompts

## Monitoring and Logging

### 10. Inconsistent Error Reporting
**Status:** 🟡 Ongoing
**Affected Area:** Error handling across all functions
**Error:** Limited error detail propagation
**Impact:** Difficult debugging and issue resolution

**Details:**
- Some functions return generic "non-2xx status code" errors
- Missing detailed error messages from OpenAI API
- Insufficient context for troubleshooting

## Recommended Actions

### Immediate (Priority 1)
1. Fix visual-prompt-generator function parameter handling
2. Verify all OpenAI model names across all edge functions
3. Test end-to-end image generation pipeline

### Short Term (Priority 2)
1. Implement comprehensive error logging with detailed messages
2. Add parameter validation in all edge functions
3. Review and standardize payload structures across functions

### Medium Term (Priority 3)
1. Implement function instance monitoring and optimization
2. Add automated testing for edge function integrations
3. Create database migration scripts to fix schema inconsistencies

### Long Term (Priority 4)
1. Implement circuit breaker patterns for external API calls
2. Add comprehensive monitoring dashboard for image generation pipeline
3. Optimize concurrency and resource management

---

**Last Updated:** August 25, 2025
**Next Review:** After implementing Priority 1 fixes
**Owner:** Development Team