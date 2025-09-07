# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/265639ae-98fe-47f5-888f-bed563c20e8d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/265639ae-98fe-47f5-888f-bed563c20e8d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Stories & Theme Generation System

This project features a comprehensive **Stories & Theme Generation System** that creates themed social media content with automated bulk processing, real-time progress tracking, and intelligent image generation.

### 🎯 System Overview

The Stories system enables users to create themed content collections (e.g., "30 Days of Healthcare Tips") with automated:
- **Theme Creation & Content Generation** - AI-powered post creation from user themes
- **Bulk Processing Workflows** - Efficient batch operations for image generation and prompt processing
- **Real-time Progress Tracking** - Live updates with shimmer effects and completion detection
- **Background Processing** - Automatic system prompt assignment and image prompt generation

### 📖 Comprehensive Documentation

**🏗️ Architecture & Integration:**
- [**Stories System Architecture**](docs/STORIES_SYSTEM_ARCHITECTURE.md) - Complete system flow and component relationships
- [**Theme Lifecycle Guide**](docs/THEME_LIFECYCLE_GUIDE.md) - Theme creation, processing, and completion workflows
- [**Frontend Integration Guide**](docs/FRONTEND_INTEGRATION_GUIDE.md) - React hooks, components, and integration patterns

**⚡ Technical References:**
- [**Edge Functions Reference**](docs/EDGE_FUNCTIONS_REFERENCE.md) - Complete edge function documentation and dependencies
- [**Image Generation Guide**](docs/IMAGE_GENERATION_COMPLETE_GUIDE.md) - Comprehensive developer and security guide
- [**Agent Documentation**](docs/agents/) - AI agent specifications and routing logic

### 🚀 Key Features

**Theme & Content Management:**
- **Theme Creation** - User-defined themes with automatic content generation
- **Content Lifecycle** - From theme input → content generation → system prompts → image generation
- **Background Processing** - Automatic `ensure-post-image-prompts` triggers for seamless UX

**Bulk Processing & Optimization:**
- **Bulk Image Generation** - Multi-aspect ratio batch processing (`bulk-generate-prompts` → `generate-image`)
- **Real-time Updates** - Live progress tracking with WebSocket subscriptions
- **Intelligent Caching** - Optimized data loading with `useOptimizedStoriesData` hook

**User Experience:**
- **Shimmer Effects** - Visual feedback during background processing (`useThemeShimmer`)
- **Progressive Enhancement** - Optimistic updates with real-time sync
- **Smart Navigation** - Automatic completion detection and theme page routing

### 🔄 System Flow Overview

```
User Input → Theme Creation → Content Generation → 
System Prompt Assignment → ensure-post-image-prompts Trigger → 
bulk-generate-prompts Processing → Image Generation → 
Real-time Progress → Completion Detection → Navigation
```

**Core Components:**
- **Frontend:** React hooks (`useThemeShimmer`, `useOptimizedStoriesData`), shimmer components
- **Backend:** Edge functions (`ensure-post-image-prompts`, `bulk-generate-prompts`, `generate-image`)
- **Database:** Themes, posts, system prompts with RLS policies and real-time subscriptions
- **AI Agents:** System prompt routing, bulk processing optimization

## Image Generation Pipeline

Legacy documentation for the underlying image generation infrastructure that powers the Stories system.

**📖 Documentation:**
- [Complete Image Generation Guide](docs/IMAGE_GENERATION_COMPLETE_GUIDE.md) - Comprehensive developer and security guide
- [Agent Documentation](docs/agents/) - Individual agent specifications

**🚀 Key Features:**
- Single and bulk image generation workflows
- AI agent ecosystem for content optimization
- Real-time progress tracking and status updates
- Intelligent caching and performance optimization
- Comprehensive error handling and monitoring

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/265639ae-98fe-47f5-888f-bed563c20e8d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
