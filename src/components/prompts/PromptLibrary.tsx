import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useEnhancedPrompts, useCreatePrompt, useUpdatePrompt, useDeletePrompt, CreatePromptData, EnhancedPrompt } from '@/hooks/useEnhancedPrompts';
import { useToast } from '@/hooks/use-toast';
import { Heart, Star, Copy, Edit3, Trash2, Plus, Search, Filter, TrendingUp, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';

export const PromptLibrary = () => {
  const [filters, setFilters] = useState({
    category: '',
    prompt_type: '',
    is_favorite: undefined as boolean | undefined,
    is_template: undefined as boolean | undefined,
    search: '',
  });
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<EnhancedPrompt | null>(null);
  
  const { data: prompts, isLoading } = useEnhancedPrompts(filters);
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();
  const { toast } = useToast();

  // Filter prompts by search term
  const filteredPrompts = prompts?.filter(prompt =>
    prompt.prompt_text.toLowerCase().includes(filters.search.toLowerCase()) ||
    prompt.cache_key.toLowerCase().includes(filters.search.toLowerCase()) ||
    (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase())))
  ) || [];

  const handleCreatePrompt = async (data: CreatePromptData) => {
    try {
      await createPrompt.mutateAsync(data);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create prompt:', error);
    }
  };

  const handleUpdatePrompt = async (id: string, updates: Partial<EnhancedPrompt>) => {
    try {
      await updatePrompt.mutateAsync({ id, updates });
      setEditingPrompt(null);
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      try {
        await deletePrompt.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete prompt:', error);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard",
    });
  };

  const PromptCard = ({ prompt }: { prompt: EnhancedPrompt }) => (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium line-clamp-2">
              {prompt.cache_key}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {prompt.category} • {prompt.prompt_type || 'General'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {prompt.is_favorite && <Heart className="h-3 w-3 fill-red-500 text-red-500" />}
            {prompt.is_template && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-2">
        <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
          {prompt.prompt_text}
        </p>
        
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {prompt.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {prompt.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{prompt.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {prompt.usage_count !== undefined && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{prompt.usage_count} uses</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(prompt.updated_at), 'MMM d')}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-3">
        <div className="flex items-center gap-1 w-full">
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(prompt.prompt_text)}
            className="h-7 px-2 text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingPrompt(prompt)}
            className="h-7 px-2 text-xs"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeletePrompt(prompt.id)}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  const CreatePromptModal = () => {
    const [formData, setFormData] = useState<CreatePromptData>({
      cache_key: '',
      prompt_text: '',
      category: 'blog_visual',
      prompt_type: 'image_generation',
      tags: [],
      is_favorite: false,
      is_template: false,
    });

    const handleSubmit = () => {
      if (!formData.cache_key || !formData.prompt_text) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      handleCreatePrompt(formData);
    };

    return (
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
            <DialogDescription>
              Add a new prompt to your library for future use.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cache_key">Prompt Name *</Label>
                <Input
                  id="cache_key"
                  value={formData.cache_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, cache_key: e.target.value }))}
                  placeholder="Descriptive name for your prompt"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog_visual">Blog Visual</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="prompt_text">Prompt Text *</Label>
              <Textarea
                id="prompt_text"
                value={formData.prompt_text}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt_text: e.target.value }))}
                placeholder="Enter your prompt text here..."
                rows={4}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_favorite: checked }))}
                />
                <Label htmlFor="is_favorite">Add to favorites</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_template"
                  checked={formData.is_template}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_template: checked }))}
                />
                <Label htmlFor="is_template">Save as template</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createPrompt.isPending}>
              {createPrompt.isPending ? 'Creating...' : 'Create Prompt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prompt Library</h1>
          <p className="text-muted-foreground">Manage and organize your AI prompts</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === 'all' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="blog_visual">Blog Visual</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="research">Research</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.prompt_type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, prompt_type: value === 'all' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image_generation">Image Generation</SelectItem>
                <SelectItem value="content_creation">Content Creation</SelectItem>
                <SelectItem value="research">Research</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filters.is_favorite ? "default" : "outline"}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  is_favorite: prev.is_favorite ? undefined : true 
                }))}
              >
                <Heart className="h-4 w-4 mr-1" />
                Favorites
              </Button>
              <Button
                size="sm"
                variant={filters.is_template ? "default" : "outline"}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  is_template: prev.is_template ? undefined : true 
                }))}
              >
                <Star className="h-4 w-4 mr-1" />
                Templates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48 animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                  <div className="h-3 bg-muted rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No prompts found</h3>
            <p className="text-muted-foreground mb-4">
              {filters.search || filters.category || filters.prompt_type
                ? "Try adjusting your filters or search terms."
                : "Get started by creating your first prompt."}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Prompt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}

      <CreatePromptModal />
    </div>
  );
};