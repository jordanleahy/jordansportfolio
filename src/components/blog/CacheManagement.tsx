
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2, Clock, FileText, AlertCircle } from 'lucide-react';
import { useCachedPrompts, useDeleteCachedPrompt, useClearAllCachedPrompts } from '@/hooks/useCachedPrompts';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CacheManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CacheManagement = ({ isOpen, onClose }: CacheManagementProps) => {
  const { data: cachedPrompts, isLoading } = useCachedPrompts();
  const deletePrompt = useDeleteCachedPrompt();
  const clearAll = useClearAllCachedPrompts();

  const handleDeletePrompt = (id: string) => {
    deletePrompt.mutate(id);
  };

  const handleClearAll = () => {
    clearAll.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cached Visual Prompts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {cachedPrompts?.length || 0} cached prompts
            </div>
            {cachedPrompts && cachedPrompts.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Cached Prompts</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your cached visual prompts. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading cached prompts...</div>
              </div>
            ) : !cachedPrompts || cachedPrompts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Cached Prompts</h3>
                <p className="text-muted-foreground">
                  Generate visual prompts in the blog editor to see them cached here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cachedPrompts.map((prompt) => (
                  <div key={prompt.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {prompt.metadata?.category || 'General'}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        
                        {prompt.metadata?.headline && (
                          <h4 className="font-medium text-sm mb-1">
                            {prompt.metadata.headline}
                          </h4>
                        )}
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {prompt.prompt_text.substring(0, 200)}...
                        </p>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Cached Prompt</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this cached prompt. The next time you generate a prompt for this content, it will be created fresh.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeletePrompt(prompt.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
