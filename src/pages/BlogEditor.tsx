import React, { useState, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { ImagePromptGenerator } from '@/components/blog/ImagePromptGenerator';

const BlogEditor = () => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [generatedImagePrompt, setGeneratedImagePrompt] = useState('');

  const { toast } = useToast();

  const handleEditorChange = useCallback((content: string) => {
    setContent(content);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    toast({
      title: "Blog Post Saved",
      description: "Your blog post has been saved successfully.",
    });
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Blog Editor</h1>
            <p className="text-muted-foreground mt-2">
              Create and edit blog posts with AI-powered content generation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
                <CardDescription>
                  Basic information about your blog post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title of your blog post"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="URL-friendly slug"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Comma-separated tags"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="URL of the blog post image"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>
                  Write the content of your blog post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Editor
                  apiKey="YOUR_TINYMCE_API_KEY"
                  value={content}
                  init={{
                    height: 500,
                    menubar: true,
                    plugins: [
                      'advlist autolink lists link image charmap print preview anchor',
                      'searchreplace visualblocks code fullscreen',
                      'insertdatetime media table paste code help wordcount'
                    ],
                    toolbar:
                      'undo redo | formatselect | ' +
                      'bold italic backcolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help'
                  }}
                  onEditorChange={handleEditorChange}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Healthcare Image Prompt Generator</CardTitle>
                <CardDescription>
                  Generate AI image prompts for healthcare job visuals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImagePromptGenerator onPromptGenerated={setGeneratedImagePrompt} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Image Prompt</CardTitle>
                <CardDescription>
                  Use the generated prompt for your blog post image
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedImagePrompt}
                  readOnly
                  placeholder="Generated image prompt will appear here"
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
                <CardDescription>
                  Control the publishing options for your blog post
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-x-2 flex items-center">
                  <Label htmlFor="status">Publish</Label>
                  <Switch
                    id="status"
                    checked={status === 'published'}
                    onCheckedChange={(checked) =>
                      setStatus(checked ? 'published' : 'draft')
                    }
                  />
                </div>
                <div>
                  <Button type="submit">Save Post</Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default BlogEditor;
