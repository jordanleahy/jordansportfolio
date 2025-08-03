import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import type { BlogPost } from "@/types/blog";

interface BlogCardProps {
  post: BlogPost;
  showImage?: boolean;
  onMouseEnter?: (slug: string) => void;
}

export const BlogCard = ({ post, showImage = true, onMouseEnter }: BlogCardProps) => {
  return (
    <Link 
      to={`/blog/${post.slug}`} 
      onMouseEnter={() => onMouseEnter?.(post.slug)}
    >
      <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 group">
        {showImage && (
          <div className="blog-image-container">
            {post.hero_image_url ? (
              <img 
                src={post.hero_image_url} 
                alt={post.hero_headline} 
                className="blog-index-image" 
              />
            ) : (
              <div className="blog-index-image bg-muted"></div>
            )}
          </div>
        )}
        <CardContent className="p-6 flex flex-col h-full">
          <div className="mb-3">
            <Badge variant="secondary">{post.category}</Badge>
          </div>
          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
            {post.hero_headline}
          </h3>
          <p className="text-muted-foreground mb-4 leading-relaxed flex-grow">
            {post.hero_subhead}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.read_time ? `${post.read_time} min read` : 'Quick read'}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};