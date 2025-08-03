import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CategoryCardProps {
  category: string;
  postCount: number;
  onClick?: () => void;
}

export const CategoryCard = ({ category, postCount, onClick }: CategoryCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/calendar/category/${encodeURIComponent(category)}`);
    }
  };

  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-border/50 hover:border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
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
          
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            {postCount}
          </Badge>
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