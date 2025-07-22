import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, Trash2, Send, Plus } from "lucide-react";
import { BlogPost, BlogPostInput, VisualSectionInput } from "@/types/blog";
import { useToast } from "@/hooks/use-toast";
import { useBlogPost, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from "@/hooks/useBlogQueries";
// import { useAutoSave } from "@/hooks/useAutoSave";
// import { AutoSaveStatus } from "@/components/blog/AutoSaveStatus";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageLayout } from '@/components/layout/PageLayout';
import { BlogVisualPrompt } from "@/components/blog/BlogVisualPrompt";
import { Sparkles } from "lucide-react";

const BlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // TanStack Query hooks
  const { data: existingPost, isLoading: loading } = useBlogPost(id);
  const createPostMutation = useCreateBlogPost();
  const updatePostMutation = useUpdateBlogPost();
  const deletePostMutation = useDeleteBlogPost();
  
  const [saving, setSaving] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState<number | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date>();

  // Form state - simplified
  const [formData, setFormData] = useState<BlogPostInput>({
    hero_headline: "",
    hero_subhead: "",
    hero_image_url: "",
    hero_video_url: "",
    hero_badge: "",
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
    cta_text: "",
    cta_url: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: [],
    og_image_url: "",
    category: "",
    tags: [],
    featured: false,
    share_enabled: true,
    status: "draft"
  });

  const [slug, setSlug] = useState("");

  // Auto-save hook - temporarily disabled
  const triggerAutoSave = (data: any) => {}; // no-op function

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
        og_image_url: existingPost.og_image_url || "",
        category: existingPost.category,
        tags: (existingPost.tags as string[]) || [],
        featured: existingPost.featured,
        share_enabled: existingPost.share_enabled,
        status: existingPost.status as "draft" | "published" | "archived"
      });
      setSlug(existingPost.slug);
    }
  }, [existingPost]);

  // Unified form update function
  const updateFormData = useCallback((updates: Partial<BlogPostInput>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      // Trigger auto-save after state update
      setTimeout(() => triggerAutoSave(newData), 0);
      return newData;
    });
  }, [triggerAutoSave]);

  // Simplified event handlers
  const handleInputChange = useCallback((field: keyof BlogPostInput, value: any) => {
    updateFormData({ [field]: value });
  }, [updateFormData]);

  const handleVisualSectionChange = useCallback((index: number, field: keyof VisualSectionInput, value: string) => {
    const newSections = [...formData.visual_sections];
    newSections[index] = { ...newSections[index], [field]: value };
    updateFormData({ visual_sections: newSections });
  }, [formData.visual_sections, updateFormData]);

  const handleTldrBulletChange = useCallback((index: number, value: string) => {
    const newBullets = [...formData.tldr_bullets];
    newBullets[index] = value;
    updateFormData({ tldr_bullets: newBullets });
  }, [formData.tldr_bullets, updateFormData]);

  const addTldrBullet = useCallback(() => {
    if (formData.tldr_bullets.length < 5) {
      updateFormData({ tldr_bullets: [...formData.tldr_bullets, ""] });
    }
  }, [formData.tldr_bullets, updateFormData]);

  const removeTldrBullet = useCallback((index: number) => {
    if (formData.tldr_bullets.length > 3) {
      const newBullets = formData.tldr_bullets.filter((_, i) => i !== index);
      updateFormData({ tldr_bullets: newBullets });
    }
  }, [formData.tldr_bullets, updateFormData]);

  const handleTagsChange = useCallback((value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    updateFormData({ tags });
  }, [updateFormData]);

  const handleKeywordsChange = useCallback((value: string) => {
    const keywords = value.split(',').map(kw => kw.trim()).filter(kw => kw);
    updateFormData({ meta_keywords: keywords });
  }, [updateFormData]);

    const handleOpenPromptModal = useCallback((index: number) => {
    setPromptModalOpen(index);
  }, []);

  const handleClosePromptModal = useCallback(() => {
    setPromptModalOpen(null);
  }, []);

  // Manual save function with full validation
  const handleSave = useCallback(async (shouldPublish = false) => {
    try {
      setSaving(true);
      
      // Validate required fields only for publishing
      if (shouldPublish) {
        if (!formData.hero_headline || !formData.hero_subhead || !formData.intro_content) {
          toast({
            variant: "destructive",
            title: "Missing required fields",
            description: "Please fill in all required hero and intro content fields before publishing."
          });
          return;
        }

        if (!formData.visual_sections.every(section => section.headline && section.content)) {
          toast({
            variant: "destructive",
            title: "Incomplete visual sections",
            description: "Each visual section must have a headline and content before publishing."
          });
          return;
        }

        if (!formData.meta_title || !formData.meta_description || !formData.category) {
          toast({
            variant: "destructive", 
            title: "Missing SEO fields",
            description: "Please fill in meta title, meta description, and category before publishing."
          });
          return;
        }

        if (!formData.cta_text || !formData.tldr_bullets || formData.tldr_bullets.length < 3) {
          toast({
            variant: "destructive",
            title: "Missing summary content", 
            description: "Please add CTA text and at least 3 TL;DR bullet points before publishing."
          });
          return;
        }
      }

      // Auto-generate slug if not provided
      const finalSlug = slug || formData.hero_headline
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');

      const postData = {
        ...formData,
        slug: finalSlug,
        status: shouldPublish ? "published" : formData.status
      };

      let result;
      if (existingPost) {
        result = await updatePostMutation.mutateAsync({
          id: existingPost.id,
          data: postData
        });
        if (result.slug !== existingPost.slug) {
          navigate(`/blog-editor/${result.slug}`);
        }
      } else {
        result = await createPostMutation.mutateAsync(postData);
        navigate(`/blog-editor/${result.slug}`);
      }

      // Update local state to reflect the changes
      if (shouldPublish) {
        setFormData(prev => ({ ...prev, status: "published" }));
      }

      toast({
        title: "Success",
        description: shouldPublish ? "Blog post published successfully" : "Blog post saved successfully"
      });

    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }, [formData, slug, existingPost, updatePostMutation, createPostMutation, navigate, toast]);

  const handleDelete = useCallback(async () => {
    if (existingPost) {
      try {
        await deletePostMutation.mutateAsync(existingPost.id);
        toast({
          title: "Blog post deleted",
          description: "The blog post has been permanently deleted."
        });
        navigate('/admin-blog');
      } catch (error) {
        console.error('Delete error:', error);
      }
    } else {
      navigate('/admin-blog');
    }
  }, [existingPost, deletePostMutation, navigate, toast]);

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
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Status and Actions */}
        <div className="mb-6 p-4 border rounded-lg bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-medium text-muted-foreground">Status:</h2>
                <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                  {formData.status === 'published' 
                    ? `published ${existingPost?.published_at ? new Date(existingPost.published_at).toLocaleDateString() : 'today'}`
                    : formData.status
                  }
                </Badge>
              </div>
              {/* AutoSaveStatus temporarily disabled */}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-3 justify-end sm:justify-start">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="min-h-[44px] sm:min-h-[36px]"
                    aria-label="Delete post"
                  >
                    <Trash2 className="xs:mr-0 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                    <AlertDialogDescription>
                      {existingPost 
                        ? "Are you sure you want to delete this blog post? This action cannot be undone."
                        : "Are you sure you want to discard this draft? Any unsaved changes will be lost."
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {existingPost ? "Delete" : "Discard"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSave(false)}
                disabled={saving}
                className="min-h-[44px] sm:min-h-[36px]"
                aria-label="Save draft"
              >
                <Save className="xs:mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Save Draft</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (slug) {
                    window.open(`/blog/${slug}?preview=true`, '_blank');
                  }
                }}
                disabled={!slug}
                className="min-h-[44px] sm:min-h-[36px]"
                aria-label="Preview post"
              >
                <Eye className="xs:mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleSave(true)}
                disabled={saving}
                className="min-h-[44px] sm:min-h-[36px] bg-primary hover:bg-primary/90"
                aria-label="Publish post"
              >
                <Send className="xs:mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Publish</span>
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
          </TabsContent>

          {/* Content Section */}
          <TabsContent value="content">
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
          </TabsContent>

          {/* Visual Sections */}
          <TabsContent value="visuals">
            <div className="space-y-6">
              {formData.visual_sections.map((section: any, index: number) => (
                
                  <Card key={index}>
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
                        <Label>Image (optional)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            value={section.image_url || ''}
                            onChange={(e) => handleVisualSectionChange(index, 'image_url', e.target.value)}
                            placeholder="Paste image or enter URL"
                            onPaste={async (e) => {
                              const items = e.clipboardData?.items;
                              if (items) {
                                for (let i = 0; i < items.length; i++) {
                                  const item = items[i];
                                  if (item.type.startsWith('image/')) {
                                    e.preventDefault();
                                    const file = item.getAsFile();
                                    if (file) {
                                      try {
                                        const { uploadImage } = await import('@/utils/imageUpload');
                                        const url = await uploadImage(file);
                                        if (url) handleVisualSectionChange(index, 'image_url', url);
                                      } catch (error) {
                                        console.error('Failed to upload pasted image:', error);
                                      }
                                    }
                                  }
                                }
                              }
                            }}
                          />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`image-upload-${index}`}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const { uploadImage } = await import('@/utils/imageUpload');
                                  const url = await uploadImage(file);
                                  if (url) handleVisualSectionChange(index, 'image_url', url);
                                } catch (error) {
                                  console.error('Failed to upload image:', error);
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                          >
                            Browse
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPromptModal(index)}
                            className="flex items-center gap-1"
                          >
                            <Sparkles className="h-4 w-4" />
                            AI Prompt
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Paste image, browse file, enter URL, or generate AI prompt</p>
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
                
              ))}
            </div>
          </TabsContent>

          {/* Summary Section */}
          <TabsContent value="summary">
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
          </TabsContent>

          {/* SEO Section */}
          <TabsContent value="seo">
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
                <div>
                  <Label htmlFor="og_image_url">OG Image URL</Label>
                  <Input
                    id="og_image_url"
                    value={formData.og_image_url || formData.hero_image_url || ''}
                    onChange={(e) => handleInputChange('og_image_url', e.target.value)}
                    placeholder="Will use Hero Image URL if empty"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Auto-populated with Hero Image URL. Override for custom OG image.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Section */}
          <TabsContent value="settings">
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
          </TabsContent>
        </Tabs>

        {/* Image Prompt Modal */}
        {promptModalOpen !== null && (
          <BlogVisualPrompt
            isOpen={promptModalOpen !== null}
            onClose={handleClosePromptModal}
            headline={formData.visual_sections[promptModalOpen]?.headline || ''}
            content={formData.visual_sections[promptModalOpen]?.content || ''}
            category="cdi"
          />
        )}
      </div>
    </PageLayout>
  );
};

export default BlogEditor;
