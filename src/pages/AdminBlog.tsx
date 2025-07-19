import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Eye, Plus } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminAllBlogPosts, useAdminDraftBlogPosts } from "@/hooks/useAdminBlogQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";

const AdminBlog = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  const { 
    data: allPosts = [], 
    isLoading: allPostsLoading, 
    error: allPostsError 
  } = useAdminAllBlogPosts();
  
  const { 
    data: draftPosts = [], 
    isLoading: draftPostsLoading, 
    error: draftPostsError 
  } = useAdminDraftBlogPosts();

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/blog');
    }
  }, [isAdmin, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const BlogPostsTable = ({ posts, loading, error }: { posts: any[], loading: boolean, error: any }) => {
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

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load blog posts: {error.message}
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
                    <Badge variant="outline">{post.category}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(post.updated_at)}</TableCell>
                  <TableCell>
                    {post.published_at ? formatDate(post.published_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === 'published' && (
                        <Link to={`/blog/${post.slug}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Link to={`/blog-editor/${post.slug}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
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
                  <Badge variant="outline">{post.category}</Badge>
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
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  {post.status === 'published' && (
                    <Link to={`/blog/${post.slug}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  )}
                  <Link to={`/blog-editor/${post.slug}`}>
                    <Button variant="default" size="sm" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
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
                New Post
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
              />
            </TabsContent>

            <TabsContent value="drafts">
              <BlogPostsTable 
                posts={draftPosts} 
                loading={draftPostsLoading} 
                error={draftPostsError} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminBlog;