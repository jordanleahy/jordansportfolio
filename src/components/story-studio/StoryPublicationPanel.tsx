import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Rocket, 
  Calendar as CalendarIcon, 
  User, 
  Tag, 
  Globe, 
  FileText,
  Share2,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ThemeData {
  id: string;
  theme_name: string;
  description: string;
  category: string;
  post_count: number;
}

interface StoryConfig {
  style: 'narrative' | 'analytical' | 'educational' | 'tutorial';
  tone: 'professional' | 'casual' | 'technical';
  length: 'quick' | 'deep' | 'comprehensive';
  audience: 'general' | 'professional' | 'technical' | 'executive';
}

interface StoryPublicationPanelProps {
  content: string;
  theme: ThemeData;
  config: StoryConfig;
}

export const StoryPublicationPanel: React.FC<StoryPublicationPanelProps> = ({
  content,
  theme,
  config
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(`${theme.theme_name}: A Comprehensive Guide`);
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState(`${theme.category}, ${config.style}, ${config.audience}`);
  const [publishDate, setPublishDate] = useState<Date>();
  const [publishStatus, setPublishStatus] = useState<'draft' | 'scheduled' | 'published'>('draft');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!content) {
      toast({
        title: "No Content",
        description: "Please generate story content before publishing",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      // TODO: Implement actual publishing logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Published!",
        description: "Your story has been published successfully"
      });
      
      setPublishStatus('published');
    } catch (error) {
      toast({
        title: "Publishing Failed",
        description: "Failed to publish your story",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!publishDate) {
      toast({
        title: "Select Date",
        description: "Please select a publish date",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      // TODO: Implement scheduling logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Scheduled!",
        description: `Story scheduled for ${format(publishDate, 'PPP')}`
      });
      
      setPublishStatus('scheduled');
    } catch (error) {
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule your story",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const exportOptions = [
    { value: 'markdown', label: 'Markdown (.md)', icon: '📝' },
    { value: 'html', label: 'HTML (.html)', icon: '🌐' },
    { value: 'pdf', label: 'PDF (.pdf)', icon: '📄' },
    { value: 'medium', label: 'Medium Article', icon: '📖' },
    { value: 'linkedin', label: 'LinkedIn Article', icon: '💼' }
  ];

  const handleExport = (format: string) => {
    // TODO: Implement export functionality
    toast({
      title: "Export Started",
      description: `Exporting story as ${format.toUpperCase()}...`
    });
  };

  if (!content) {
    return (
      <Card className="bg-card/80 backdrop-blur border-accent/20">
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <Rocket className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">Ready to Publish</h3>
            <p className="text-muted-foreground">
              Generate your story content first to access publishing options
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Rocket className="h-5 w-5 text-accent" />
          <span>Publication Settings</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Publication Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter story title..."
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle (Optional)</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Add a compelling subtitle..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags..."
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Publishing Options */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <Globe className="h-4 w-4 text-accent" />
            <span>Publishing Options</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Publish Now */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Rocket className="h-4 w-4 text-accent" />
                  <span className="font-medium">Publish Now</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Make your story live immediately
                </p>
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing || publishStatus === 'published'}
                  className="w-full"
                >
                  {isPublishing ? 'Publishing...' : 'Publish Now'}
                </Button>
              </div>
            </Card>

            {/* Schedule Publishing */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-accent" />
                  <span className="font-medium">Schedule</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Schedule for future publication
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {publishDate ? format(publishDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={publishDate}
                      onSelect={setPublishDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  onClick={handleSchedule}
                  disabled={isPublishing || !publishDate}
                  variant="outline"
                  className="w-full"
                >
                  {isPublishing ? 'Scheduling...' : 'Schedule'}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Export Options */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <Download className="h-4 w-4 text-accent" />
            <span>Export Options</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className="justify-start h-auto p-3"
                onClick={() => handleExport(option.value)}
              >
                <span className="mr-3">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Publication Status */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center space-x-2">
            <Eye className="h-4 w-4 text-accent" />
            <span>Status</span>
          </h4>
          
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Badge 
                variant={publishStatus === 'published' ? 'default' : 'outline'}
                className={publishStatus === 'published' ? 'bg-green-500' : ''}
              >
                {publishStatus === 'published' ? '✅ Published' : 
                 publishStatus === 'scheduled' ? '📅 Scheduled' : '✏️ Draft'}
              </Badge>
              {publishStatus === 'scheduled' && publishDate && (
                <span className="text-sm text-muted-foreground">
                  for {format(publishDate, 'PPP')}
                </span>
              )}
            </div>
            
            {publishStatus === 'published' && (
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};