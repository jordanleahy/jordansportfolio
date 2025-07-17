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
                  {post.status}
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
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/blog')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
            <h1 className="text-lg font-semibold">Blog Administration</h1>
          </div>
          <Link to="/blog-editor">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Posts ({allPosts.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftPosts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Blog Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <BlogPostsTable 
                  posts={allPosts} 
                  loading={allPostsLoading} 
                  error={allPostsError} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts">
            <Card>
              <CardHeader>
                <CardTitle>Draft Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <BlogPostsTable 
                  posts={draftPosts} 
                  loading={draftPostsLoading} 
                  error={draftPostsError} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBlog;