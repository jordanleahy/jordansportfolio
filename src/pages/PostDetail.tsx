import React, { Suspense } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { ArrowLeft, Calendar, Tag, Lightbulb, Mic, Image as ImageIcon } from 'lucide-react';
import { useColorTheme } from '@/hooks/useColorThemes';
import { ImagePreviewModal } from '@/components/stories/ImagePreviewModal';
import { VoiceoverScriptModal } from '@/components/voiceover/VoiceoverScriptModal';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import type { SocialMediaPost } from '@/types/socialMedia';

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [previewImage, setPreviewImage] = React.useState<{ url: string; alt: string } | null>(null);
  const [showVoiceoverModal, setShowVoiceoverModal] = React.useState(false);
  
  // Image generation hook
  const { 
    isGenerating, 
    generationStep, 
    generateHeroImage, 
    creditStatus 
  } = useImageGeneration();

  // Fetch the specific post
  const { 
    data: post, 
    isLoading: isLoadingPost, 
    error,
    refetch: refetchPost
  } = useQuery({
    queryKey: ['social-media-post', postId],
    queryFn: () => optimizedSocialMediaService.getPostById(postId!),
    enabled: !!postId,
  });

  const { data: colorTheme } = useColorTheme(post?.color_theme_id || '');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-700 border-green-500/20';
      case 'scheduled': return 'bg-blue-500/20 text-blue-700 border-blue-500/20';
      default: return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20';
    }
  };

  const handleImageClick = (imageUrl: string, alt: string) => {
    setPreviewImage({ url: imageUrl, alt });
  };

  const handleGenerateImage = async () => {
    if (!post) return;
    
    await generateHeroImage(
      {
        id: post.id,
        title: post.title,
        description: post.description,
        category: post.category
      },
      colorTheme,
      refetchPost
    );
  };

  const handleBackClick = () => {
    // Navigate back to the theme if we have it, otherwise go to stories dashboard
    if (post?.theme_id) {
      navigate(`/stories/id/${post.theme_id}`);
    } else if (post?.category) {
      // Fallback to category for backward compatibility
      navigate(`/stories/theme/${encodeURIComponent(post.category)}`);
    } else {
      navigate('/stories');
    }
  };

  if (loading || isLoadingPost) {
    return (
      <PageLayout>
        <CalendarSkeletonLoader />
      </PageLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (error || !post) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The post you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/stories')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stories
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {post.category || 'Stories'}
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              {/* Post Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                
                {/* Badges */}
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge className={`${getStatusColor(post.status)} text-sm`}>
                    {post.status === 'published' ? new Date(post.updated_at).toLocaleDateString() : post.status}
                  </Badge>
                  
                  {post.category && (
                    <Badge variant="outline" className="text-sm">
                      <Tag className="h-3 w-3 mr-1" />
                      {post.category}
                    </Badge>
                  )}
                  
                  {post.day && (
                    <Badge variant="outline" className="text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {post.day}
                    </Badge>
                  )}
                  
                  {colorTheme && (
                    <Badge variant="outline" className="text-sm">
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded-full border border-border" 
                          style={{ backgroundColor: colorTheme.primary_color }}
                        />
                        {colorTheme.name}
                      </div>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-8">
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                    {post.description}
                  </p>
                </div>
              </div>

              {/* 1:1 Hero Image Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1:1 Hero Image</h2>
                <div className="space-y-4">
                  {post.image_1_1_url ? (
                    <div className="space-y-2">
                      <img
                        src={post.image_1_1_url}
                        alt="1:1 Hero image"
                        className="w-full max-w-md h-auto rounded-lg border cursor-pointer hover:opacity-80 transition-opacity mx-auto"
                        onClick={() => handleImageClick(post.image_1_1_url!, '1:1 Hero image')}
                      />
                      <p className="text-sm text-muted-foreground text-center">
                        Status: {post.image_1_1_status || 'complete'}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full max-w-md mx-auto aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center p-8">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-center text-muted-foreground">
                        No 1:1 hero image generated yet
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <Button
                      onClick={handleGenerateImage}
                      disabled={isGenerating || !creditStatus?.hasCredits}
                      className="gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {isGenerating ? generationStep || 'Generating...' : 'Generate 1:1 Image'}
                    </Button>
                  </div>
                  
                  {!creditStatus?.hasCredits && (
                    <p className="text-sm text-destructive text-center">
                      Credit limit reached
                    </p>
                  )}
                </div>
              </div>

              {/* Other Images Section */}
              {(post.image_16_9_url || post.image_9_16_url || post.image_3_4_url || post.image_4_3_url) && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Other Images</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {post.image_16_9_url && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Landscape (16:9)</p>
                        <img
                          src={post.image_16_9_url}
                          alt="Landscape 16:9 image"
                          className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(post.image_16_9_url!, 'Landscape 16:9 image')}
                        />
                      </div>
                    )}
                    
                    {post.image_9_16_url && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Portrait (9:16)</p>
                        <img
                          src={post.image_9_16_url}
                          alt="Portrait 9:16 image"
                          className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(post.image_9_16_url!, 'Portrait 9:16 image')}
                        />
                      </div>
                    )}
                    
                    {post.image_3_4_url && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Social (3:4)</p>
                        <img
                          src={post.image_3_4_url}
                          alt="Social 3:4 image"
                          className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(post.image_3_4_url!, 'Social 3:4 image')}
                        />
                      </div>
                    )}
                    
                    {post.image_4_3_url && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Standard (4:3)</p>
                        <img
                          src={post.image_4_3_url}
                          alt="Standard 4:3 image"
                          className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(post.image_4_3_url!, 'Standard 4:3 image')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {(post.image_16_9_video_url || post.image_3_4_video_url || post.general_video_url) && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Videos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {post.image_16_9_video_url && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Landscape Video (16:9)</p>
                        <video
                          src={post.image_16_9_video_url}
                          controls
                          className="w-full h-auto rounded-lg border"
                        />
                      </div>
                    )}
                    
                    {post.image_3_4_video_url && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Portrait Video (3:4)</p>
                        <video
                          src={post.image_3_4_video_url}
                          controls
                          className="w-full h-auto rounded-lg border"
                        />
                      </div>
                    )}
                    
                    {post.general_video_url && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">General Video</p>
                        <video
                          src={post.general_video_url}
                          controls
                          className="w-full h-auto rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowVoiceoverModal(true)}
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Generate Voiceover
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
          <ImagePreviewModal
            isOpen={true}
            onClose={() => setPreviewImage(null)}
            imageUrl={previewImage.url}
            imageAlt={previewImage.alt}
          />
        )}

        {/* Voiceover Modal */}
        {showVoiceoverModal && (
          <VoiceoverScriptModal
            isOpen={showVoiceoverModal}
            onClose={() => setShowVoiceoverModal(false)}
            sourceId={post.id}
            sourceType="social_media_post"
            originalContent={`${post.title}\n\n${post.description}`}
          />
        )}
      </div>
    </PageLayout>
  );
}