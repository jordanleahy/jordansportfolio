import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CategoryCardProps {
  category: string;
  postCount: number;
  imageUrl?: string;
  onClick?: () => void;
}

export const CategoryCard = ({ category, postCount, imageUrl, onClick }: CategoryCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/stories/category/${encodeURIComponent(category)}`);
    }
  };

  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-border/50 hover:border-primary/20 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`${category} preview`}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              // Fallback to gradient background if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* Fallback gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
          <FolderOpen className="h-12 w-12 text-primary/60" />
        </div>
        
        {/* Overlay for better text readability when we have an image */}
        {imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
        
        {/* Badge positioned over image */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-white/90 text-primary hover:bg-white">
            {postCount}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg capitalize text-foreground group-hover:text-primary transition-colors">
              {category}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {postCount} {postCount === 1 ? 'post' : 'posts'}
              </span>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleClick}
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-primary group-hover:bg-primary/5"
        >
          <span>View Details</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
};