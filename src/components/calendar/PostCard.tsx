import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Trash2, ImageIcon, Upload, Loader2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardProps {
  post: SocialMediaPost;
  onCopy: (post: SocialMediaPost) => void;
  onDelete: (postId: string) => void;
  onGeneratePrompt: (post: SocialMediaPost) => void;
  onFileSelect: (postId: string, event: React.ChangeEvent<HTMLInputElement>, type: '16_9' | '9_16' | '3_4' | '4_3') => void;
  uploadingStates: {
    [key: string]: boolean;
  };
}

export const PostCard = ({ 
  post, 
  onCopy, 
  onDelete, 
  onGeneratePrompt, 
  onFileSelect, 
  uploadingStates 
}: PostCardProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showImageUploads, setShowImageUploads] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-700 border-green-500/20';
      case 'scheduled': return 'bg-blue-500/20 text-blue-700 border-blue-500/20';
      default: return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20';
    }
  };

  const truncateText = (text: string, limit: number) => {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  const ImageUploadButton = ({ type, label, isUploading }: { 
    type: '16_9' | '9_16' | '3_4' | '4_3'; 
    label: string; 
    isUploading: boolean;
  }) => {
    const imageUrl = type === '16_9' ? post.image_16_9_url :
                    type === '9_16' ? post.image_9_16_url :
                    type === '3_4' ? post.image_3_4_url :
                    post.image_4_3_url;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={isUploading}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => onFileSelect(post.id, e as any, type);
              input.click();
            }}
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
          </Button>
        </div>
        {imageUrl && (
          <div className="relative">
            <OptimizedImage
              src={imageUrl}
              alt={`${label} for ${post.title}`}
              className="w-full h-16 object-cover rounded border"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
            <Badge className={`${getStatusColor(post.status)} mt-2 text-xs`}>
              {post.status}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(post)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(post.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isExpanded ? post.description : truncateText(post.description, 120)}
          </p>
          {post.description.length > 120 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-auto p-0 mt-1 text-xs text-primary"
            >
              {isExpanded ? (
                <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
              ) : (
                <>Read more <ChevronDown className="h-3 w-3 ml-1" /></>
              )}
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGeneratePrompt(post)}
            className="flex-1"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Generate Prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImageUploads(!showImageUploads)}
            className="flex-1"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Images
            {showImageUploads ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>

        {/* Image Upload Section */}
        {showImageUploads && (
          <div className="border-t pt-4">
            <Tabs defaultValue="16_9" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="16_9" className="text-xs">16:9</TabsTrigger>
                <TabsTrigger value="9_16" className="text-xs">9:16</TabsTrigger>
                <TabsTrigger value="3_4" className="text-xs">3:4</TabsTrigger>
                <TabsTrigger value="4_3" className="text-xs">4:3</TabsTrigger>
              </TabsList>
              
              <TabsContent value="16_9" className="mt-3">
                <ImageUploadButton 
                  type="16_9" 
                  label="Landscape (16:9)" 
                  isUploading={uploadingStates[`${post.id}_16_9`] || false} 
                />
              </TabsContent>
              
              <TabsContent value="9_16" className="mt-3">
                <ImageUploadButton 
                  type="9_16" 
                  label="Portrait (9:16)" 
                  isUploading={uploadingStates[`${post.id}_9_16`] || false} 
                />
              </TabsContent>
              
              <TabsContent value="3_4" className="mt-3">
                <ImageUploadButton 
                  type="3_4" 
                  label="Social (3:4)" 
                  isUploading={uploadingStates[`${post.id}_3_4`] || false} 
                />
              </TabsContent>
              
              <TabsContent value="4_3" className="mt-3">
                <ImageUploadButton 
                  type="4_3" 
                  label="Standard (4:3)" 
                  isUploading={uploadingStates[`${post.id}_4_3`] || false} 
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Image Previews - Show any existing images */}
        {(post.image_16_9_url || post.image_9_16_url || post.image_3_4_url || post.image_4_3_url) && !showImageUploads && (
          <div className="flex gap-2 overflow-x-auto">
            {post.image_16_9_url && (
              <OptimizedImage
                src={post.image_16_9_url}
                alt="16:9 image"
                className="h-12 w-auto rounded border flex-shrink-0"
              />
            )}
            {post.image_9_16_url && (
              <OptimizedImage
                src={post.image_9_16_url}
                alt="9:16 image"
                className="h-12 w-auto rounded border flex-shrink-0"
              />
            )}
            {post.image_3_4_url && (
              <OptimizedImage
                src={post.image_3_4_url}
                alt="3:4 image"
                className="h-12 w-auto rounded border flex-shrink-0"
              />
            )}
            {post.image_4_3_url && (
              <OptimizedImage
                src={post.image_4_3_url}
                alt="4:3 image"
                className="h-12 w-auto rounded border flex-shrink-0"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};