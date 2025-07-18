# Netlify Prerendering Setup

This project uses Netlify's prerendering plugin to generate static HTML files for blog posts, ensuring proper social media sharing with Open Graph meta tags.

## How it works

1. **Build Process**: During build, `scripts/generate-prerender-routes.js` fetches all published blog post slugs from Supabase and creates a routes file.

2. **Prerendering**: Netlify's prerender plugin generates static HTML files for each route, including proper meta tags for social media crawlers.

3. **Environment Variables Required**:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Setup on Netlify

1. Add environment variables in Netlify dashboard under Site settings > Environment variables
2. Deploy - the build process will automatically generate prerendered pages
3. Test social media sharing with LinkedIn's sharing debugger

## Files Modified

- `netlify.toml` - Configured prerender plugin and build command
- `scripts/generate-prerender-routes.js` - Generates routes for prerendering
- `src/components/blog/BlogTemplate.tsx` - Updated with proper OG tags

## Testing

Use LinkedIn's Post Inspector or Facebook's Sharing Debugger to verify that the correct meta tags are being served for blog post URLs.