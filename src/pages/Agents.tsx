import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AgentCard } from '@/components/agents/AgentCard';
import { useAgents, useDeleteAgent } from '@/hooks/useAgents';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import PageLayout from '@/components/layout/PageLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CATEGORIES = ['all', 'healthcare', 'finance', 'general', 'contracts'];

export default function Agents() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: agents = [], isLoading } = useAgents();
  const deleteAgentMutation = useDeleteAgent();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteAgent = (agentId: string) => {
    deleteAgentMutation.mutate(agentId);
    setAgentToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      {/* Page Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">AI Agents</h1>
              <p className="text-muted-foreground">Manage and interact with your AI agents</p>
            </div>
            <Button 
              onClick={() => navigate('/agents/new')}
              size="default"
              className="shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    selectedCategory === category && "shadow-sm"
                  )}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-16">
            {agents.length === 0 ? (
              <div>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No agents yet</h2>
                <p className="text-muted-foreground mb-6">Create your first AI agent to get started</p>
                <Button onClick={() => navigate('/agents/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">No agents match your search criteria</p>
              </div>
            )}
          </div>
        ) : (
          <div className={cn(
            "grid gap-6",
            isMobile ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"
          )}>
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                variant={isMobile ? "compact" : "detailed"}
                onChat={() => navigate(`/agents/${agent.slug}`)}
                onEdit={() => navigate(`/agents/${agent.slug}/edit`)}
                onDelete={() => setAgentToDelete(agent.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!agentToDelete} onOpenChange={() => setAgentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agent? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => agentToDelete && handleDeleteAgent(agentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}