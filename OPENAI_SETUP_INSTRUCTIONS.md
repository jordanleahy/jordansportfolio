# OpenAI API Key Setup Instructions

## The Issue
Your batch image generation is failing because the OpenAI API key is not configured in your Supabase environment. All image generation attempts are returning 500 status codes with "OpenAI API key not configured" errors.

## Quick Fix

1. **Get your OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key if you don't have one
   - Copy the key (starts with `sk-...`)

2. **Add it to Supabase:**
   - Go to your Supabase Dashboard
   - Navigate to Settings → Edge Functions → Environment Variables
   - Add a new variable:
     - Name: `OPENAI_API_KEY`
     - Value: Your OpenAI API key
   - Save the changes

3. **Test the fix:**
   - Try clicking the sparkle button again
   - The batch image generation should now work

## Important Notes
- Make sure you have sufficient credits in your OpenAI account
- Image generation uses the `gpt-image-1` model at ~$0.040 per image
- Each batch generates 4 images (one per aspect ratio)

## Alternative: Temporary Fix with Secrets Form
If you prefer, I can create a secrets form for you to enter the API key directly in this interface.