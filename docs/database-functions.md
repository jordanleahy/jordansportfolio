# Database Functions Documentation

This document provides an overview of all database functions in the system, organized by category and purpose.

## Trigger Functions (Auto-Update Timestamps)

These functions automatically update `updated_at` timestamps when records are modified.

### `update_daily_work_summaries_updated_at()`
- **Purpose**: Updates the `updated_at` timestamp for daily work summaries
- **Trigger**: Fires on UPDATE of `daily_work_summaries` table
- **Returns**: `trigger`

### `update_agent_constants_updated_at()`
- **Purpose**: Updates the `updated_at` timestamp for agent constants
- **Trigger**: Fires on UPDATE of `agent_constants` table
- **Returns**: `trigger`

### `update_agent_templates_updated_at()`
- **Purpose**: Updates the `updated_at` timestamp for agent templates
- **Trigger**: Fires on UPDATE of `agent_templates` table
- **Returns**: `trigger`

### `update_agent_categories_updated_at()`
- **Purpose**: Updates the `updated_at` timestamp for agent categories
- **Trigger**: Fires on UPDATE of `agent_categories` table
- **Returns**: `trigger`

### `update_agent_model_options_updated_at()`
- **Purpose**: Updates the `updated_at` timestamp for agent model options
- **Trigger**: Fires on UPDATE of `agent_model_options` table
- **Returns**: `trigger`

### `update_characters_updated_at()`
- **Purpose**: Updates the `updated_at` timestamp for characters
- **Trigger**: Fires on UPDATE of `characters` table
- **Returns**: `trigger`

### `update_openai_usage_sync_logs_updated_at()`
- **Purpose**: Updates the `updated_at` timestamp for OpenAI usage sync logs
- **Trigger**: Fires on UPDATE of `openai_usage_sync_logs` table
- **Returns**: `trigger`

### `update_monthly_aggregates_updated_at()`
- **Purpose**: Updates the `updated_at` timestamp for monthly aggregates
- **Trigger**: Fires on UPDATE of `api_usage_monthly_aggregates` table
- **Returns**: `trigger`

## Authentication & User Management

### `get_user_roles(p_user_id uuid)`
- **Purpose**: Retrieves all roles assigned to a specific user
- **Parameters**: `p_user_id` - The user's UUID
- **Returns**: Table of roles (`app_role` type)
- **Security**: `SECURITY DEFINER` - runs with elevated privileges

### `create_default_user_settings()`
- **Purpose**: Creates default user settings when a new user is created
- **Trigger**: Fires on INSERT of user records
- **Returns**: `trigger`

## Agent & System Prompt Management

### `get_agent_name(constant_name text)`
- **Purpose**: Retrieves agent name from the agent constants table
- **Parameters**: `constant_name` - The constant name to look up
- **Returns**: `text` - The corresponding constant value
- **Security**: `SECURITY DEFINER` with restricted search path

### `create_system_prompt_version()`
- **Purpose**: Creates versioned records of system prompts for change tracking
- **Trigger**: Fires on INSERT/UPDATE of `system_prompts` table
- **Features**: 
  - Auto-increments version numbers
  - Deactivates previous versions
  - Tracks change descriptions and metadata
- **Returns**: `trigger`

### `fix_hardcoded_aspect_ratio_in_prompts()`
- **Purpose**: Updates Blog Visual Prompt Generator agents to use dynamic aspect ratios
- **Features**:
  - Removes hardcoded aspect ratio formatting
  - Updates prompt templates to integrate aspect ratios naturally
  - Batch processes all affected agents
- **Returns**: `text` - Summary of changes made

## Content Management & Submissions

### `check_theme_submission_rate_limit(p_user_id uuid, p_time_window_minutes integer, p_max_submissions integer)`
- **Purpose**: Implements rate limiting for theme submissions to prevent abuse
- **Parameters**: 
  - `p_user_id` - User UUID
  - `p_time_window_minutes` - Time window (default: 5 minutes)
  - `p_max_submissions` - Maximum submissions allowed (default: 3)
- **Returns**: `boolean` - true if under limit, false if exceeded
- **Security**: `SECURITY DEFINER`

### `log_submission_event(p_user_id uuid, p_submission_id uuid, p_event_type text, p_event_data jsonb, p_processing_time_ms integer)`
- **Purpose**: Logs events related to theme submissions for tracking and debugging
- **Parameters**: User ID, submission ID, event type, optional event data, and processing time
- **Returns**: `uuid` - The log entry ID
- **Security**: `SECURITY DEFINER`

### `get_submission_analytics(p_user_id uuid)`
- **Purpose**: Provides comprehensive analytics for a user's theme submissions
- **Returns**: Table with metrics including:
  - Total submissions
  - Success/failure counts
  - Duplicate attempts
  - Average processing time
  - Last submission date
- **Security**: `SECURITY DEFINER`

### `cleanup_old_submissions()`
- **Purpose**: Removes old completed/failed submissions (older than 24 hours)
- **Returns**: `integer` - Number of records deleted
- **Security**: `SECURITY DEFINER`

## Theme & Content Lifecycle Management

### `update_lifecycle_status_trigger()`
- **Purpose**: Auto-updates theme lifecycle status based on prompt generation progress
- **Logic**:
  - Sets status to 'ready' when prompt generation completes
  - Sets status to 'generating' when in progress
  - Updates user interaction flags
- **Returns**: `trigger`

### `update_theme_completion_status()`
- **Purpose**: Tracks and updates theme completion statistics
- **Features**:
  - Counts completed vs total posts per theme
  - Updates theme's prompt generation status
  - Maintains completion counts
- **Returns**: `trigger`
- **Security**: `SECURITY DEFINER`

### `invalidate_theme_cache_on_status_change()`
- **Purpose**: Logs theme status changes for debugging and cache invalidation
- **Returns**: `trigger`

## Collection & Sharing Management

### `publish_shared_collection_1_1(p_handle text, p_title text, p_description text, p_post_ids uuid[], p_theme_id uuid)`
- **Purpose**: Creates and publishes shared collections using 1:1 aspect ratio images
- **Features**:
  - Validates handle format
  - Requires minimum 1 post with 1:1 image
  - Orders posts by day number
  - Sets cover image from day 1 post
- **Returns**: `uuid` - Collection ID
- **Security**: Requires authentication

### `publish_shared_collection_16_9(p_handle text, p_title text, p_description text, p_post_ids uuid[], p_category text, p_theme_id uuid)`
- **Purpose**: Creates and publishes shared collections using 16:9 aspect ratio images
- **Features**: Similar to 1:1 version but for landscape images
- **Returns**: `uuid` - Collection ID

### `update_shared_collection_1_1(p_collection_id uuid, p_theme_id uuid)`
- **Purpose**: Updates existing shared collection with current posts
- **Features**:
  - Rebuilds collection items from current posts
  - Updates metadata and publish timestamp
  - Supports theme filtering
- **Returns**: `uuid` - Collection ID

## Data Management & Cleanup

### `cleanup_duplicate_posts(p_user_id uuid, p_category text, p_theme_id uuid, p_keep_latest boolean)`
- **Purpose**: Removes duplicate posts for a user/category/theme combination
- **Parameters**: 
  - User ID, category, theme ID
  - `p_keep_latest` - Whether to keep newest (true) or oldest (false)
- **Returns**: Table with cleanup statistics
- **Security**: `SECURITY DEFINER`

### `cleanup_expired_cache()`
- **Purpose**: Removes expired entries from the cached_prompts table
- **Returns**: `integer` - Number of records deleted
- **Security**: `SECURITY DEFINER`

## Usage Analytics & Aggregation

### `get_or_create_monthly_aggregate(target_user_id uuid, target_month date)`
- **Purpose**: Ensures monthly usage aggregate record exists for user/month
- **Features**:
  - Creates new aggregate if none exists
  - Includes subscription tier information
  - Uses current user's tier or defaults to 'free'
- **Returns**: `uuid` - Aggregate record ID
- **Security**: `SECURITY DEFINER`

### `refresh_monthly_aggregates(target_month date, target_user_id uuid)`
- **Purpose**: Recalculates monthly usage statistics from raw usage data
- **Features**:
  - Processes all active users or specific user
  - Aggregates requests, costs, tokens, and generation counts
  - Updates existing records or creates new ones
- **Returns**: `integer` - Number of users processed
- **Security**: `SECURITY DEFINER`

### `update_monthly_aggregate_on_usage()`
- **Purpose**: Real-time updates to monthly aggregates when new usage is recorded
- **Trigger**: Fires on INSERT to `api_usage_tracking` table
- **Features**:
  - Only processes users with 'starter' or 'admin' tiers
  - Increments counters and accumulates costs/tokens
- **Returns**: `trigger`
- **Security**: `SECURITY DEFINER`

## Content Seeding Functions

### `insert_cdi_content()`
- **Purpose**: Seeds the database with Clinical Documentation Integrity content
- **Features**: 
  - Inserts 30 days of CDI-related social media posts
  - Only runs for authenticated users
  - Creates draft status posts
- **Returns**: `void`
- **Security**: `SECURITY DEFINER`

### `insert_contracts_content()`
- **Purpose**: Seeds the database with healthcare contracts content
- **Features**: 
  - Inserts 28+ days of contract-related social media posts
  - Covers RCM contracts, payer agreements, fee schedules, etc.
- **Returns**: `void`
- **Security**: `SECURITY DEFINER`

### `add_coding_ai_data_for_user(target_user_id uuid)`
- **Purpose**: Adds AI-powered medical coding content for a specific user
- **Features**: 
  - Inserts 5 posts about autonomous coding and AI in healthcare
  - Targets specific user rather than authenticated user
- **Returns**: `integer` - Number of posts inserted

## Security Notes

- Functions marked `SECURITY DEFINER` run with elevated privileges
- Most functions include proper user authentication checks
- Rate limiting functions prevent abuse
- Trigger functions maintain data integrity automatically
- Search paths are restricted on sensitive functions to prevent SQL injection

## Usage Patterns

1. **Trigger Functions**: Automatically maintain data consistency
2. **Rate Limiting**: Prevent abuse while allowing normal usage
3. **Analytics Functions**: Provide insights into system usage
4. **Content Management**: Handle complex content lifecycle workflows
5. **Cleanup Functions**: Maintain system performance by removing old data