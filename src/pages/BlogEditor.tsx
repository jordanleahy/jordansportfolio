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
import { BlogService } from "@/services/blogService";
import { BlogPost, BlogPostInput, VisualSectionInput } from "@/types/blog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
        />
      </div>
      <div>
        <Label htmlFor="hero_subhead">Subheading *</Label>
        <Textarea
          id="hero_subhead"
          value={formData.hero_subhead}
          onChange={(e) => handleInputChange('hero_subhead', e.target.value)}
          placeholder="Supporting text that explains the value proposition"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="hero_image_url">Hero Image URL</Label>
        <Input
          id="hero_image_url"
          value={formData.hero_image_url}
          onChange={(e) => handleInputChange('hero_image_url', e.target.value)}
          placeholder="https://example.com/hero-image.jpg"
        />
      </div>
      <div>
        <Label htmlFor="hero_video_url">Hero Video URL (optional)</Label>
        <Input
          id="hero_video_url"
          value={formData.hero_video_url}
          onChange={(e) => handleInputChange('hero_video_url', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
      <div>
        <Label htmlFor="hero_badge">Badge Text (optional)</Label>
        <Input
          id="hero_badge"
          value={formData.hero_badge}
          onChange={(e) => handleInputChange('hero_badge', e.target.value)}
          placeholder="NEW, TRENDING, etc."
        />
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
          />
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
          />
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
            </div>
            <div>
              <Label>Image URL *</Label>
              <Input
                value={section.image_url}
                onChange={(e) => handleVisualSectionChange(index, 'image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
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
          <Label htmlFor="tldr_title">TL;DR Title</Label>
          <Input
            id="tldr_title"
            value={formData.tldr_title}
            onChange={(e) => handleInputChange('tldr_title', e.target.value)}
            placeholder="TL;DR"
          />
        </div>
        <div>
          <Label>Bullet Points (3-5 points)</Label>
          <div className="space-y-2">
            {formData.tldr_bullets.map((bullet: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) => handleTldrBulletChange(index, e.target.value)}
                  placeholder={`Bullet point ${index + 1}`}
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
        </div>
        <div>
          <Label htmlFor="cta_url">CTA URL</Label>
          <Input
            id="cta_url"
            value={formData.cta_url}
            onChange={(e) => handleInputChange('cta_url', e.target.value)}
            placeholder="https://example.com/signup"
          />
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
      </div>
      <div>
        <Label htmlFor="meta_title">Meta Title *</Label>
        <Input
          id="meta_title"
          value={formData.meta_title}
          onChange={(e) => handleInputChange('meta_title', e.target.value)}
          placeholder="SEO optimized title"
        />
      </div>
      <div>
        <Label htmlFor="meta_description">Meta Description *</Label>
        <Textarea
          id="meta_description"
          value={formData.meta_description}
          onChange={(e) => handleInputChange('meta_description', e.target.value)}
          placeholder="Brief description for search engines"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="category">Category *</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          placeholder="Technology, Business, etc."
        />
      </div>
      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={formData.tags.join(', ')}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="tag1, tag2, tag3"
        />
      </div>
      <div>
        <Label htmlFor="keywords">Meta Keywords (comma separated)</Label>
        <Input
          id="keywords"
          value={formData.meta_keywords.join(', ')}
          onChange={(e) => handleKeywordsChange(e.target.value)}
          placeholder="keyword1, keyword2, keyword3"
        />
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingPost, setExistingPost] = useState<BlogPost | null>(null);

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

  // Load existing post for editing
  useEffect(() => {
    if (id) {
      const loadPost = async () => {
        try {
          setLoading(true);
          const post = await BlogService.getPostBySlug(id);
          if (post) {
            setExistingPost(post);
            setFormData({
              hero_headline: post.hero_headline,
              hero_subhead: post.hero_subhead,
              hero_image_url: post.hero_image_url || "",
              hero_video_url: post.hero_video_url || "",
              hero_badge: post.hero_badge || "",
              intro_content: post.intro_content,
              visual_sections: post.visual_sections as VisualSectionInput[],
              tldr_title: post.tldr_title,
              tldr_bullets: post.tldr_bullets as string[],
              deep_dive_title: post.deep_dive_title || "",
              deep_dive_content: post.deep_dive_content || "",
              cta_text: post.cta_text,
              cta_url: post.cta_url || "",
              meta_title: post.meta_title,
              meta_description: post.meta_description,
              meta_keywords: (post.meta_keywords as string[]) || [],
              category: post.category,
              tags: (post.tags as string[]) || [],
              featured: post.featured,
              share_enabled: post.share_enabled,
              status: post.status as "draft" | "published" | "archived"
            });
            setSlug(post.slug);
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load blog post",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };
      loadPost();
    }
  }, [id, toast]);

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

  const handleSave = async (shouldPublish = false) => {
    try {
      setSaving(true);
      
      // Auto-generate slug if not provided
      if (!slug) {
        const generatedSlug = formData.hero_headline
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');
        setSlug(generatedSlug);
      }

      const postData = {
        ...formData,
        slug: slug || formData.hero_headline.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'),
        status: shouldPublish ? "published" : formData.status
      };

      let result;
      if (existingPost) {
        result = await BlogService.updatePost(existingPost.id, postData);
      } else {
        result = await BlogService.createPost(postData);
      }

      toast({
        title: "Success",
        description: `Blog post ${shouldPublish ? 'published' : 'saved'} successfully`
      });

      if (!existingPost) {
        navigate(`/blog-editor/${result.slug}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save blog post",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

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