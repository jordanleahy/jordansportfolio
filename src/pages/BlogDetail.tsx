import React, { Suspense, lazy } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useBlogPost } from "@/hooks/useBlogQueries";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

// Lazy load heavy BlogTemplate component
const BlogTemplate = lazy(() => import("@/components/blog/BlogTemplate").then(module => ({ 
  default: module.BlogTemplate 
})));

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Use TanStack Query for blog post
  const { 
    data: post, 
    isLoading: loading, 
    error,
    refetch
  } = useBlogPost(slug);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
          <Card className="p-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center pt-16">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Failed to load blog post</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Something went wrong while loading this blog post.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()}>Try Again</Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <Suspense fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading blog post...</p>
            </div>
          </div>
        }>
          <BlogTemplate post={post} />
        </Suspense>
      </div>
    </div>
  );
};

export default BlogDetail;