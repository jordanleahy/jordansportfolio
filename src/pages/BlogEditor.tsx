import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Save, Eye, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { BlogPost, BlogPostInput, VisualSectionInput } from "@/types/blog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useBlogPost, useCreateBlogPost, useUpdateBlogPost } from "@/hooks/useBlogQueries";

// Debounce utility
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Memoized Tab Components
const HeroSection = memo(({ formData, handleInputChange }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>Hero Section</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="hero_headline">Headline *</Label>
        <Input
          id="hero_headline"
          value={formData.hero_headline}
          onChange={(e) => handleInputChange('hero_headline', e.target.value)}
          placeholder="Compelling headline for your blog post"
          maxLength={60}
        />
        <p className="text-xs text-muted-foreground mt-1">Required, 5-60 characters</p>
      </div>
      <div>
        <Label htmlFor="hero_subhead">Subheading *</Label>
        <Textarea
          id="hero_subhead"
          value={formData.hero_subhead}
          onChange={(e) => handleInputChange('hero_subhead', e.target.value)}
          placeholder="Supporting text that explains the value proposition"
          rows={3}
          maxLength={150}
        />
        <p className="text-xs text-muted-foreground mt-1">Required, 80-150 characters (15-25 words)</p>
      </div>
      <div>
        <Label htmlFor="hero_image_url">Hero Image URL (optional)</Label>
        <Input
          id="hero_image_url"
          value={formData.hero_image_url}
          onChange={(e) => handleInputChange('hero_image_url', e.target.value)}
          placeholder="https://example.com/hero-image.jpg"
        />
        <p className="text-xs text-muted-foreground mt-1">Must be a valid URL if provided</p>
      </div>
      <div>
        <Label htmlFor="hero_video_url">Hero Video URL (optional)</Label>
        <Input
          id="hero_video_url"
          value={formData.hero_video_url}
          onChange={(e) => handleInputChange('hero_video_url', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
        <p className="text-xs text-muted-foreground mt-1">Must be a valid URL if provided</p>
      </div>
      <div>
        <Label htmlFor="hero_badge">Badge Text (optional)</Label>
        <Input
          id="hero_badge"
          value={formData.hero_badge}
          onChange={(e) => handleInputChange('hero_badge', e.target.value)}
          placeholder="NEW, TRENDING, etc."
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground mt-1">Maximum 20 characters</p>
      </div>
    </CardContent>
  </Card>
));

const ContentSection = memo(({ formData, handleInputChange }: any) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle>Introduction Content</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="intro_content">Introduction Paragraph *</Label>
          <p className="text-sm text-muted-foreground mb-2">50-75 words that hook the reader</p>
          <Textarea
            id="intro_content"
            value={formData.intro_content}
            onChange={(e) => handleInputChange('intro_content', e.target.value)}
            placeholder="Write a compelling introduction that hooks the reader..."
            rows={4}
            maxLength={450}
          />
          <p className="text-xs text-muted-foreground mt-1">Required, 250-450 characters (50-75 words)</p>
        </div>
      </CardContent>
    </Card>

    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Deep Dive Section (Optional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="deep_dive_title">Deep Dive Title</Label>
          <Input
            id="deep_dive_title"
            value={formData.deep_dive_title}
            onChange={(e) => handleInputChange('deep_dive_title', e.target.value)}
            placeholder="Going Deeper: Advanced Insights"
          />
        </div>
        <div>
          <Label htmlFor="deep_dive_content">Deep Dive Content</Label>
          <p className="text-sm text-muted-foreground mb-2">Maximum 250 words</p>
          <Textarea
            id="deep_dive_content"
            value={formData.deep_dive_content}
            onChange={(e) => handleInputChange('deep_dive_content', e.target.value)}
            placeholder="Additional detailed insights for interested readers..."
            rows={6}
            maxLength={1500}
          />
          <p className="text-xs text-muted-foreground mt-1">Optional, maximum 1500 characters (250 words)</p>
        </div>
      </CardContent>
    </Card>
  </>
));

const VisualsSection = memo(({ formData, handleVisualSectionChange }: any) => (
  <div className="space-y-6">
    {formData.visual_sections.map((section: any, index: number) => (
      <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Visual Section {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Headline * (max 40 characters)</Label>
              <Input
                value={section.headline}
                onChange={(e) => handleVisualSectionChange(index, 'headline', e.target.value)}
                placeholder="Section headline"
                maxLength={40}
              />
              <p className="text-xs text-muted-foreground mt-1">Required, 3-40 characters</p>
            </div>
            <div>
              <Label>Content * (300-480 characters)</Label>
              <Textarea
                value={section.content}
                onChange={(e) => handleVisualSectionChange(index, 'content', e.target.value)}
                placeholder="Section content (60-80 words)"
                rows={4}
                maxLength={480}
              />
              <p className="text-xs text-muted-foreground mt-1">Required, 60-80 words (300-480 characters)</p>
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={section.image_url || ''}
                onChange={(e) => handleVisualSectionChange(index, 'image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">Must be a valid URL if provided</p>
            </div>
            <div>
              <Label>CTA Text (optional)</Label>
              <Input
                value={section.cta_text || ''}
                onChange={(e) => handleVisualSectionChange(index, 'cta_text', e.target.value)}
                placeholder="Learn More"
              />
            </div>
            <div>
              <Label>CTA URL (optional)</Label>
              <Input
                value={section.cta_url || ''}
                onChange={(e) => handleVisualSectionChange(index, 'cta_url', e.target.value)}
                placeholder="https://example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">Must be a valid URL if provided</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </div>
));

const SummarySection = memo(({ formData, handleInputChange, handleTldrBulletChange, addTldrBullet, removeTldrBullet }: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>TL;DR Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="tldr_title">TL;DR Title *</Label>
          <Input
            id="tldr_title"
            value={formData.tldr_title}
            onChange={(e) => handleInputChange('tldr_title', e.target.value)}
            placeholder="TL;DR"
          />
          <p className="text-xs text-muted-foreground mt-1">Required field</p>
        </div>
        <div>
          <Label>Bullet Points * (3-5 points)</Label>
          <div className="space-y-2">
            {formData.tldr_bullets.map((bullet: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) => handleTldrBulletChange(index, e.target.value)}
                  placeholder={`Bullet point ${index + 1}`}
                  maxLength={100}
                />
                {formData.tldr_bullets.length > 3 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeTldrBullet(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {formData.tldr_bullets.length < 5 && (
              <Button variant="outline" size="sm" onClick={addTldrBullet}>
                <Plus className="mr-2 h-4 w-4" />
                Add Bullet Point
              </Button>
            )}
            <p className="text-xs text-muted-foreground mt-1">Required, each bullet should be 10-100 characters</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Call to Action</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cta_text">CTA Text *</Label>
          <Input
            id="cta_text"
            value={formData.cta_text}
            onChange={(e) => handleInputChange('cta_text', e.target.value)}
            placeholder="Get Started Today"
          />
          <p className="text-xs text-muted-foreground mt-1">Required field</p>
        </div>
        <div>
          <Label htmlFor="cta_url">CTA URL (optional)</Label>
          <Input
            id="cta_url"
            value={formData.cta_url}
            onChange={(e) => handleInputChange('cta_url', e.target.value)}
            placeholder="https://example.com/signup"
          />
          <p className="text-xs text-muted-foreground mt-1">Must be a valid URL if provided</p>
        </div>
      </CardContent>
    </Card>
  </div>
));

const SEOSection = memo(({ formData, slug, setSlug, handleInputChange, handleTagsChange, handleKeywordsChange }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>SEO & Metadata</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="slug">URL Slug *</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-blog-post-title"
        />
        <p className="text-xs text-muted-foreground mt-1">Required, must be unique</p>
      </div>
      <div>
        <Label htmlFor="meta_title">Meta Title *</Label>
        <Input
          id="meta_title"
          value={formData.meta_title}
          onChange={(e) => handleInputChange('meta_title', e.target.value)}
          placeholder="SEO optimized title"
          maxLength={60}
        />
        <p className="text-xs text-muted-foreground mt-1">Required, 10-60 characters</p>
      </div>
      <div>
        <Label htmlFor="meta_description">Meta Description *</Label>
        <Textarea
          id="meta_description"
          value={formData.meta_description}
          onChange={(e) => handleInputChange('meta_description', e.target.value)}
          placeholder="Brief description for search engines"
          rows={3}
          maxLength={155}
        />
        <p className="text-xs text-muted-foreground mt-1">Required, 50-155 characters</p>
      </div>
      <div>
        <Label htmlFor="category">Category *</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          placeholder="Technology, Business, etc."
        />
        <p className="text-xs text-muted-foreground mt-1">Required field</p>
      </div>
      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={formData.tags.join(', ')}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="tag1, tag2, tag3"
        />
        <p className="text-xs text-muted-foreground mt-1">Optional, helps with categorization</p>
      </div>
      <div>
        <Label htmlFor="keywords">Meta Keywords (comma separated)</Label>
        <Input
          id="keywords"
          value={formData.meta_keywords.join(', ')}
          onChange={(e) => handleKeywordsChange(e.target.value)}
          placeholder="keyword1, keyword2, keyword3"
        />
        <p className="text-xs text-muted-foreground mt-1">Optional, helps with SEO</p>
      </div>
    </CardContent>
  </Card>
));

const SettingsSection = memo(({ formData, handleInputChange }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>Post Settings</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="featured">Featured Post</Label>
          <p className="text-sm text-muted-foreground">Display this post prominently</p>
        </div>
        <Switch
          id="featured"
          checked={formData.featured}
          onCheckedChange={(checked) => handleInputChange('featured', checked)}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="share_enabled">Enable Sharing</Label>
          <p className="text-sm text-muted-foreground">Allow readers to share this post</p>
        </div>
        <Switch
          id="share_enabled"
          checked={formData.share_enabled}
          onCheckedChange={(checked) => handleInputChange('share_enabled', checked)}
        />
      </div>
    </CardContent>
  </Card>
));

const BlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // TanStack Query hooks
  const { data: existingPost, isLoading: loading } = useBlogPost(id);
  const createPostMutation = useCreateBlogPost();
  const updatePostMutation = useUpdateBlogPost();
  
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<BlogPostInput>({
    // Hero section
    hero_headline: "",
    hero_subhead: "",
    hero_image_url: "",
    hero_video_url: "",
    hero_badge: "",

    // Content
    intro_content: "",
    visual_sections: [
      { headline: "", content: "", image_url: "", cta_text: "", cta_url: "" },
      { headline: "", content: "", image_url: "", cta_text: "", cta_url: "" },
      { headline: "", content: "", image_url: "", cta_text: "", cta_url: "" }
    ],
    tldr_title: "TL;DR",
    tldr_bullets: ["", "", ""],
    deep_dive_title: "",
    deep_dive_content: "",

    // CTA
    cta_text: "",
    cta_url: "",

    // SEO & Meta
    meta_title: "",
    meta_description: "",
    meta_keywords: [],
    category: "",
    tags: [],

    // Settings
    featured: false,
    share_enabled: true,
    status: "draft"
  });

  const [slug, setSlug] = useState("");

  // Initialize form data when existing post loads
  useEffect(() => {
    if (existingPost) {
      setFormData({
        hero_headline: existingPost.hero_headline,
        hero_subhead: existingPost.hero_subhead,
        hero_image_url: existingPost.hero_image_url || "",
        hero_video_url: existingPost.hero_video_url || "",
        hero_badge: existingPost.hero_badge || "",
        intro_content: existingPost.intro_content,
        visual_sections: existingPost.visual_sections as VisualSectionInput[],
        tldr_title: existingPost.tldr_title,
        tldr_bullets: existingPost.tldr_bullets as string[],
        deep_dive_title: existingPost.deep_dive_title || "",
        deep_dive_content: existingPost.deep_dive_content || "",
        cta_text: existingPost.cta_text,
        cta_url: existingPost.cta_url || "",
        meta_title: existingPost.meta_title,
        meta_description: existingPost.meta_description,
        meta_keywords: (existingPost.meta_keywords as string[]) || [],
        category: existingPost.category,
        tags: (existingPost.tags as string[]) || [],
        featured: existingPost.featured,
        share_enabled: existingPost.share_enabled,
        status: existingPost.status as "draft" | "published" | "archived"
      });
      setSlug(existingPost.slug);
    }
  }, [existingPost]);

  // Performance optimized event handlers with useCallback
  const handleInputChange = useCallback((field: keyof BlogPostInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleVisualSectionChange = useCallback((index: number, field: keyof VisualSectionInput, value: string) => {
    setFormData(prev => {
      const newSections = [...prev.visual_sections];
      newSections[index] = { ...newSections[index], [field]: value };
      return { ...prev, visual_sections: newSections };
    });
  }, []);

  const handleTldrBulletChange = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const newBullets = [...prev.tldr_bullets];
      newBullets[index] = value;
      return { ...prev, tldr_bullets: newBullets };
    });
  }, []);

  const addTldrBullet = useCallback(() => {
    setFormData(prev => {
      if (prev.tldr_bullets.length < 5) {
        return { ...prev, tldr_bullets: [...prev.tldr_bullets, ""] };
      }
      return prev;
    });
  }, []);

  const removeTldrBullet = useCallback((index: number) => {
    setFormData(prev => {
      if (prev.tldr_bullets.length > 3) {
        const newBullets = prev.tldr_bullets.filter((_, i) => i !== index);
        return { ...prev, tldr_bullets: newBullets };
      }
      return prev;
    });
  }, []);

  const handleTagsChange = useCallback((value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  }, []);

  const handleKeywordsChange = useCallback((value: string) => {
    const keywords = value.split(',').map(kw => kw.trim()).filter(kw => kw);
    setFormData(prev => ({ ...prev, meta_keywords: keywords }));
  }, []);

  // Debounced auto-save
  const debouncedAutoSave = useDebounce(useCallback(() => {
    if (formData.hero_headline && !saving) {
      handleSave(false);
    }
  }, [formData, saving]), 2000);

  // Trigger auto-save on form changes
  useEffect(() => {
    if (!existingPost && formData.hero_headline) {
      debouncedAutoSave();
    }
  }, [formData, debouncedAutoSave, existingPost]);

const handleSave = useCallback(async (shouldPublish = false) => {
    try {
      setSaving(true);
      
      // Validate required fields before saving
      if (!formData.hero_headline || !formData.hero_subhead || !formData.intro_content) {
        toast({
          variant: "destructive",
          title: "Missing required fields",
          description: "Please fill in all required hero and intro content fields."
        });
        return;
      }

      // Validate visual sections
      if (!formData.visual_sections.every(section => section.headline && section.content)) {
        toast({
          variant: "destructive",
          title: "Incomplete visual sections",
          description: "Each visual section must have a headline and content."
        });
        return;
      }

      // Auto-generate slug if not provided
      if (!slug) {
        const generatedSlug = formData.hero_headline
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');
        setSlug(generatedSlug);
      }

      // Clean up empty URLs
      const cleanedVisualSections = formData.visual_sections.map(section => ({
        ...section,
        image_url: section.image_url || null,
        cta_url: section.cta_url || null,
        cta_text: section.cta_text || null
      }));

      const postData = {
        ...formData,
        visual_sections: cleanedVisualSections,
        hero_image_url: formData.hero_image_url || null,
        hero_video_url: formData.hero_video_url || null,
        cta_url: formData.cta_url || null,
        slug: slug || formData.hero_headline.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'),
        status: shouldPublish ? "published" : formData.status
      };

      if (existingPost) {
        const result = await updatePostMutation.mutateAsync({
          id: existingPost.id,
          data: postData
        });
        // Navigate to the updated slug if it changed
        if (result.slug !== existingPost.slug) {
          navigate(`/blog-editor/${result.slug}`);
        }
      } else {
        const result = await createPostMutation.mutateAsync(postData);
        navigate(`/blog-editor/${result.slug}`);
      }
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }, [formData, slug, existingPost, updatePostMutation, createPostMutation, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading blog post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/blog')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
            <h1 className="text-lg font-semibold">
              {existingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Status and Actions */}
        <div className="mb-6 p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">Post Status:</h2>
              <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                {formData.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (slug) {
                    window.open(`/blog/${slug}`, '_blank');
                  }
                }}
                disabled={!slug}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>
        </div>
        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="visuals">Visuals</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero">
            <HeroSection formData={formData} handleInputChange={handleInputChange} />
          </TabsContent>

          {/* Content Section */}
          <TabsContent value="content">
            <ContentSection formData={formData} handleInputChange={handleInputChange} />
          </TabsContent>

          {/* Visual Sections */}
          <TabsContent value="visuals">
            <VisualsSection formData={formData} handleVisualSectionChange={handleVisualSectionChange} />
          </TabsContent>

          {/* Summary Section */}
          <TabsContent value="summary">
            <SummarySection 
              formData={formData} 
              handleInputChange={handleInputChange}
              handleTldrBulletChange={handleTldrBulletChange}
              addTldrBullet={addTldrBullet}
              removeTldrBullet={removeTldrBullet}
            />
          </TabsContent>

          {/* SEO Section */}
          <TabsContent value="seo">
            <SEOSection 
              formData={formData}
              slug={slug}
              setSlug={setSlug}
              handleInputChange={handleInputChange}
              handleTagsChange={handleTagsChange}
              handleKeywordsChange={handleKeywordsChange}
            />
          </TabsContent>

          {/* Settings Section */}
          <TabsContent value="settings">
            <SettingsSection formData={formData} handleInputChange={handleInputChange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BlogEditor;