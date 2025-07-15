import { Agent } from '@/types/agent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, MessageCircle, Edit, Trash2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AgentCardProps {
  agent: Agent;
  variant?: 'compact' | 'detailed';
  onChat: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const AgentCard = ({ 
  agent, 
  variant = 'compact', 
  onChat, 
  onEdit, 
  onDelete 
}: AgentCardProps) => {
  const isCompact = variant === 'compact';

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200",
        "hover:shadow-md active:scale-[0.98]",
        "border-border/50 hover:border-border"
      )}
      onClick={onChat}
    >
      <CardContent className={cn("p-4", isCompact && "p-3")}>
        <div className="flex items-start gap-3">
          {/* Agent Avatar */}
          <Avatar className={cn("shrink-0", isCompact ? "h-10 w-10" : "h-12 w-12")}>
            <AvatarImage src={agent.avatar_url} alt={agent.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <Bot className={cn(isCompact ? "h-4 w-4" : "h-5 w-5")} />
            </AvatarFallback>
          </Avatar>

          {/* Agent Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-semibold text-foreground truncate",
                  isCompact ? "text-sm" : "text-base"
                )}>
                  {agent.name}
                </h3>
                {agent.description && (
                  <p className={cn(
                    "text-muted-foreground mt-1",
                    isCompact ? "text-xs line-clamp-1" : "text-sm line-clamp-2"
                  )}>
                    {agent.description}
                  </p>
                )}
              </div>

              {/* Status & Menu */}
              <div className="flex items-center gap-2 shrink-0">
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full",
                    agent.is_active ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )}
                />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onChat(); }}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                {agent.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {agent.model}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};