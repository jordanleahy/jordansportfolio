import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, VisualSection } from "@/types/blog";
import { BlogTemplate } from "@/components/blog/BlogTemplate";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, GripVertical, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ThemeData {
  id: string;
  theme_name: string;
  description: string | null;
  category: string;
  posts: Array<{
    id: string;
    title: string;
    description: string;
    day?: number;
    image_16_9_url?: string;
    image_1_1_url?: string;
    image_4_3_url?: string;
    image_9_16_url?: string;
    image_3_4_url?: string;
  }>;
}

export default function ThemeBlogPreview() {
  const { themeId } = useParams<{ themeId: string }>();
  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [mockBlogPost, setMockBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({});
  const [showConfiguration, setShowConfiguration] = useState(false);

  useEffect(() => {
  const fetchThemeData = async () => {
      if (!themeId) return;

      try {
        // Fetch theme data
        const { data: theme, error: themeError } = await supabase
          .from('themes')
          .select('*')
          .eq('id', themeId)
          .single();

        if (themeError) throw themeError;

        // Fetch posts for this theme with 1:1 images prioritized
        const { data: posts, error: postsError } = await supabase
          .from('social_media_posts')
          .select('id, title, description, day, image_16_9_url, image_1_1_url, image_4_3_url, image_9_16_url, image_3_4_url')
          .eq('theme_id', themeId)
          .order('day', { ascending: true });

        if (postsError) throw postsError;

        const themeWithPosts = {
          ...theme,
          posts: posts || []
        };

        setThemeData(themeWithPosts);

        // Initialize all sections as enabled
        const initialEnabledState: Record<string, boolean> = {};
        themeWithPosts.posts.forEach(post => {
          initialEnabledState[post.id] = true;
        });
        setEnabledSections(initialEnabledState);

        // Create mock blog post from theme data
        const mockPost = createMockBlogPost(themeWithPosts);
        setMockBlogPost(mockPost);

      } catch (error) {
        console.error('Error fetching theme data:', error);
        toast.error('Failed to load theme data');
      } finally {
        setLoading(false);
      }
    };

    fetchThemeData();
  }, [themeId]);

  const createMockBlogPost = (theme: ThemeData): BlogPost => {
    // Helper function to get the best available image (prioritizing 1:1, then others)
    const getBestImage = (post: any) => {
      return post.image_1_1_url || 
             post.image_4_3_url || 
             post.image_3_4_url || 
             post.image_9_16_url || 
             post.image_16_9_url || 
             null;
    };

    // Create visual sections from ENABLED posts only
    const enabledPosts = theme.posts.filter(post => enabledSections[post.id]);
    const visualSections: VisualSection[] = enabledPosts.map((post, index) => ({
      headline: post.title,
      content: `${post.description} This section explores the key insights and practical applications that make this approach effective for modern businesses.`,
      image_url: getBestImage(post),
      cta_text: index === 0 ? "Learn More" : null,
      cta_url: index === 0 ? "#" : null
    }));

    // Create TL;DR bullets from enabled posts only
    const tldrBullets = enabledPosts.slice(0, 6).map(post => 
      `${post.title}: Key insights and practical applications`
    );

    return {
      id: `mock-${theme.id}`,
      user_id: 'mock-user',
      slug: `${theme.theme_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-preview`,
      
      // Hero section
      hero_headline: theme.theme_name,
      hero_subhead: theme.description || `Discover the comprehensive insights and strategies that make ${theme.theme_name.toLowerCase()} a game-changer for your business.`,
      hero_image_url: getBestImage(theme.posts[0]),
      hero_image_16_9_url: getBestImage(theme.posts[0]),
      hero_video_url: null,
      hero_badge: theme.category,
      
      // Content sections
      intro_content: `${theme.description || ''} In this comprehensive guide, we'll explore the key strategies, insights, and practical applications that can transform your approach and drive meaningful results.`,
      visual_sections: visualSections as unknown as any,
      
      // TL;DR section
      tldr_title: "Key Takeaways",
      tldr_bullets: tldrBullets.length > 0 ? tldrBullets : [
        "Comprehensive strategy overview and implementation guide",
        "Real-world applications and practical examples", 
        "Key insights for sustainable growth and success",
        "Actionable steps to drive meaningful results"
      ],
      
      // Optional deep dive
      deep_dive_title: "Advanced Implementation Strategy",
      deep_dive_content: `For organizations looking to maximize their ${theme.theme_name.toLowerCase()} approach, the key lies in systematic implementation and continuous optimization. This involves careful planning, stakeholder alignment, and measurable outcomes that drive long-term success.`,
      
      // CTA section
      cta_text: "Get Started Today",
      cta_url: "/stories",
      share_enabled: true,
      
      // SEO and meta
      meta_title: `${theme.theme_name} - Complete Guide & Strategy`,
      meta_description: `Discover comprehensive insights about ${theme.theme_name.toLowerCase()}. Learn key strategies, practical applications, and actionable steps for success.`,
      meta_keywords: [theme.category, 'strategy', 'guide', 'business', 'insights'],
      category: theme.category,
      tags: [theme.category, 'preview'],
      
      // Technical fields
      status: 'draft' as const,
      featured: false,
      word_count: enabledPosts.length * 120, // Approximate word count based on number of enabled sections
      read_time: Math.ceil((enabledPosts.length * 120) / 200), // 200 words per minute reading speed
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: null,
      theme: theme.theme_name
    } as BlogPost;
  };

  // Update mock blog post when sections are toggled
  useEffect(() => {
    if (themeData) {
      const updatedMockPost = createMockBlogPost(themeData);
      setMockBlogPost(updatedMockPost);
    }
  }, [enabledSections, themeData]);

  const toggleSection = (postId: string) => {
    setEnabledSections(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const enabledCount = Object.values(enabledSections).filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!themeData || !mockBlogPost) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Theme not found</h1>
          <Button asChild>
            <Link to="/stories">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/stories/studio/${themeId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Studio
              </Link>
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfiguration(!showConfiguration)}
            >
              {showConfiguration ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showConfiguration ? 'Hide' : 'Configure'} Sections
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                Blog Preview
              </span>
              <span>•</span>
              <span>{enabledCount}/{themeData?.posts.length || 0} sections</span>
              <span>•</span>
              <span>{mockBlogPost.word_count} words</span>
              <span>•</span>
              <span>{mockBlogPost.read_time} min read</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm" disabled>
            <ExternalLink className="w-4 h-4 mr-2" />
            Publish to Blog
          </Button>
        </div>
      </div>

      {/* Section Configuration Panel */}
      {showConfiguration && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Configure Blog Sections</h2>
              <p className="text-sm text-muted-foreground">
                Toggle sections on/off to customize which posts appear in your final blog post. 
                Disabled sections will be excluded from the generated content.
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {themeData?.posts.map((post, index) => (
                <Card 
                  key={post.id} 
                  className={`p-4 transition-all ${
                    enabledSections[post.id] 
                      ? 'bg-background border-border' 
                      : 'bg-muted/50 border-dashed opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                          Section {index + 1}
                        </span>
                        {post.day && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Day {post.day}
                          </span>
                        )}
                      </div>
                      <h3 className={`font-semibold text-sm mb-1 ${
                        !enabledSections[post.id] ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {post.title}
                      </h3>
                      <p className={`text-xs text-muted-foreground line-clamp-2 ${
                        !enabledSections[post.id] ? 'opacity-50' : ''
                      }`}>
                        {post.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Switch
                        checked={enabledSections[post.id]}
                        onCheckedChange={() => toggleSection(post.id)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {enabledSections[post.id] ? 'Included' : 'Excluded'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Blog Content */}
      <BlogTemplate post={mockBlogPost} />
    </div>
  );
}