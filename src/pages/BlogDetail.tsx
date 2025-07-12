import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BlogPost } from "@/types/blog";
import { BlogService } from "@/services/blogService";
import { BlogTemplate } from "@/components/blog/BlogTemplate";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError("No blog post ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedPost = await BlogService.getPostBySlug(id);
        
        if (!fetchedPost) {
          setError("Blog post not found");
        } else {
          setPost(fetchedPost);
        }
      } catch (err) {
        console.error("Failed to fetch blog post:", err);
        setError("Failed to load blog post. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div className="border-b bg-card/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Skeleton className="h-9 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Hero skeleton */}
        <div className="relative min-h-[60vh] flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <Skeleton className="h-80 w-full mx-auto" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-64 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Blog Post Not Found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            This blog post might not exist in our database yet, or there was an error loading it.
          </p>
        </Card>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return <BlogTemplate post={post} />;
};

export default BlogDetail;