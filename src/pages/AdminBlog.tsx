import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Eye, Plus, Trash2, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminAllBlogPosts, useAdminDraftBlogPosts, useDeleteBlogPost } from "@/hooks/useAdminBlogQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLayout } from '@/components/layout/PageLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VoiceoverScriptModal } from "@/components/voiceover/VoiceoverScriptModal";

const AdminBlog = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<any>(null);
  const [voiceoverModalOpen, setVoiceoverModalOpen] = useState(false);
  const [selectedPostForVoiceover, setSelectedPostForVoiceover] = useState<any>(null);
  
  console.log('AdminBlog component state:', {
    user: user?.id,
    authLoading,
    isAdmin,
    roleLoading,
    userAuthenticated: !!user,
    adminCheckComplete: !roleLoading
  });
  
  const { 
    data: allPosts = [], 
    isLoading: allPostsLoading, 
    error: allPostsError,
    isError: allPostsIsError
  } = useAdminAllBlogPosts();
  
  const { 
    data: draftPosts = [], 
    isLoading: draftPostsLoading, 
    error: draftPostsError,
    isError: draftPostsIsError
  } = useAdminDraftBlogPosts();

  const deleteBlogPost = useDeleteBlogPost();

  const handleDeleteClick = (post: any) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (postToDelete) {
      deleteBlogPost.mutate(postToDelete.id);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const handleVoiceoverClick = (post: any) => {
    setSelectedPostForVoiceover(post);
    setVoiceoverModalOpen(true);
  };

  const createContentForVoiceover = (post: any) => {
    // Combine blog content for voiceover script generation
    const sections = [
      post.hero_headline,
      post.hero_subhead,
      post.intro_content,
      ...(post.visual_sections || []).map((section: any) => `${section.headline} ${section.content}`),
      post.tldr_title,
      ...(post.tldr_bullets || []),
      post.deep_dive_content
    ].filter(Boolean);
    
    return sections.join(' ');
  };

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth');
      } else if (!isAdmin) {
        console.log('User is not admin, redirecting to blog');
        navigate('/blog');
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  // Show loading while checking authentication and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {authLoading ? 'Checking authentication...' : 'Checking permissions...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated or not admin
  if (!user || !isAdmin) {
    return null; // Will redirect
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const BlogPostsTable = ({ posts, loading, error, isError }: { posts: any[], loading: boolean, error: any, isError: boolean }) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-[300px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          ))}
        </div>
      );
    }

    if (isError && error) {
      console.error('Blog posts table error:', error);
      return (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load blog posts: {error.message}
            {!user && <div className="mt-2 text-sm">Authentication required to view admin content.</div>}
          </AlertDescription>
        </Alert>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No blog posts found.
        </div>
      );
    }

    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    <div className="max-w-[300px] truncate">
                      {post.hero_headline || 'Untitled'}
                    </div>
                    {post.hero_subhead && (
                      <div className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {post.hero_subhead}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      post.status === 'published' ? 'default' : 
                      post.status === 'draft' ? 'secondary' : 'outline'
                    }>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">LLM Models Globally</Badge>
                  </TableCell>
                  <TableCell>{formatDate(post.updated_at)}</TableCell>
                  <TableCell>
                    {post.published_at ? formatDate(post.published_at) : '-'}
                  </TableCell>
                   <TableCell className="text-right">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {post.status === 'published' && (
                          <Link to={`/blog/${post.slug}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleVoiceoverClick(post)}
                          title="Generate Voiceover Script"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Link to={`/blog-editor/${post.slug}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClick(post)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="space-y-3">
                {/* Title and Subtitle */}
                <div>
                  <h3 className="font-medium text-foreground leading-tight">
                    {post.hero_headline || 'Untitled'}
                  </h3>
                  {post.hero_subhead && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {post.hero_subhead}
                    </p>
                  )}
                </div>

                {/* Status and Category */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={
                    post.status === 'published' ? 'default' : 
                    post.status === 'draft' ? 'secondary' : 'outline'
                  }>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </Badge>
                  <Badge variant="outline">LLM Models Globally</Badge>
                </div>

                {/* Dates */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{formatDate(post.updated_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Published:</span>
                    <span>{post.published_at ? formatDate(post.published_at) : 'Not published'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <div className="flex gap-2">
                    {post.status === 'published' && (
                      <Link to={`/blog/${post.slug}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVoiceoverClick(post)}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Link to={`/blog-editor/${post.slug}`}>
                      <Button variant="default" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteClick(post)}
                    className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Blog Administration</h1>
              <p className="text-muted-foreground">Manage your blog posts and drafts</p>
            </div>
            <Link to="/blog-editor">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Template Post
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
              <TabsTrigger value="all">All Posts ({allPosts.length})</TabsTrigger>
              <TabsTrigger value="drafts">Drafts ({draftPosts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <BlogPostsTable 
                posts={allPosts} 
                loading={allPostsLoading} 
                error={allPostsError}
                isError={allPostsIsError}
              />
            </TabsContent>

            <TabsContent value="drafts">
              <BlogPostsTable 
                posts={draftPosts} 
                loading={draftPostsLoading} 
                error={draftPostsError}
                isError={draftPostsIsError}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{postToDelete?.hero_headline || 'this post'}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Voiceover Script Modal */}
        {selectedPostForVoiceover && (
          <VoiceoverScriptModal
            isOpen={voiceoverModalOpen}
            onClose={() => {
              setVoiceoverModalOpen(false);
              setSelectedPostForVoiceover(null);
            }}
            sourceId={selectedPostForVoiceover.id}
            sourceType="blog_post"
            originalContent={createContentForVoiceover(selectedPostForVoiceover)}
            contentType="blog_post"
          />
        )}
    </PageLayout>
  );
};

export default AdminBlog;
