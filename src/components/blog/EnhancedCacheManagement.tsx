import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Trash2, 
  Clock, 
  FileText, 
  BarChart3,
  CheckSquare,
  Square,
  Filter,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { 
  useCachedPrompts, 
  useCachedPromptsStats,
  useDeleteCachedPrompt, 
  useBulkDeleteCachedPrompts,
  useClearAllCachedPrompts 
} from "@/hooks/useCachedPrompts";

interface EnhancedCacheManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryColors = {
  blog_visual: "bg-blue-100 text-blue-800",
  job_visual: "bg-green-100 text-green-800",
  default: "bg-gray-100 text-gray-800"
};

const categoryLabels = {
  blog_visual: "Blog Visual",
  job_visual: "Job Visual",
};

export const EnhancedCacheManagement = ({ isOpen, onClose }: EnhancedCacheManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("prompts");

  const { data: allPrompts = [], isLoading } = useCachedPrompts();
  const { data: stats = {} } = useCachedPromptsStats();
  const deletePrompt = useDeleteCachedPrompt();
  const bulkDeletePrompts = useBulkDeleteCachedPrompts();
  const clearAllPrompts = useClearAllCachedPrompts(selectedCategory || undefined);

  const categories = useMemo(() => {
    const cats = new Set(allPrompts.map(p => p.category));
    return Array.from(cats);
  }, [allPrompts]);

  const filteredPrompts = useMemo(() => {
    return allPrompts.filter(prompt => {
      const matchesSearch = !searchTerm || 
        prompt.prompt_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.metadata?.headline && prompt.metadata.headline.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [allPrompts, searchTerm, selectedCategory]);

  const handleSelectAll = () => {
    if (selectedPrompts.size === filteredPrompts.length) {
      setSelectedPrompts(new Set());
    } else {
      setSelectedPrompts(new Set(filteredPrompts.map(p => p.id)));
    }
  };

  const handleSelectPrompt = (id: string) => {
    const newSelected = new Set(selectedPrompts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPrompts(newSelected);
  };

  const handleBulkDelete = () => {
    bulkDeletePrompts.mutate(Array.from(selectedPrompts), {
      onSuccess: () => {
        setSelectedPrompts(new Set());
        setShowBulkDeleteDialog(false);
      }
    });
  };

  const handleClearAll = () => {
    clearAllPrompts.mutate(undefined, {
      onSuccess: () => {
        setSelectedPrompts(new Set());
        setShowClearAllDialog(false);
      }
    });
  };

  const getPromptPreview = (text: string) => {
    return text.length > 150 ? text.substring(0, 150) + "..." : text;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Prompt Cache Management
            </DialogTitle>
            <DialogDescription>
              Manage your cached AI prompts and view analytics
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prompts">Cached Prompts</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="prompts" className="flex-1 flex flex-col min-h-0 space-y-4">
              {/* Search and Filters */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={selectedCategory ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                    >
                      {categoryLabels[category as keyof typeof categoryLabels] || category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bulk Actions */}
              {filteredPrompts.length > 0 && (
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-6 w-6 p-0"
                    >
                      {selectedPrompts.size === filteredPrompts.length ? 
                        <CheckSquare className="h-4 w-4" /> : 
                        <Square className="h-4 w-4" />
                      }
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedPrompts.size > 0 ? 
                        `${selectedPrompts.size} selected` : 
                        `${filteredPrompts.length} prompts`
                      }
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedPrompts.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDeleteDialog(true)}
                        disabled={bulkDeletePrompts.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Selected
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearAllDialog(true)}
                      disabled={clearAllPrompts.isPending}
                    >
                      Clear {selectedCategory ? categoryLabels[selectedCategory as keyof typeof categoryLabels] || selectedCategory : 'All'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Prompts List */}
              <ScrollArea className="flex-1 min-h-0">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading prompts...</div>
                ) : filteredPrompts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || selectedCategory ? 'No prompts match your filters' : 'No cached prompts found'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPrompts.map((prompt) => (
                      <Card key={prompt.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                checked={selectedPrompts.has(prompt.id)}
                                onCheckedChange={() => handleSelectPrompt(prompt.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={categoryColors[prompt.category as keyof typeof categoryColors] || categoryColors.default}>
                                    {categoryLabels[prompt.category as keyof typeof categoryLabels] || prompt.category}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })}
                                  </div>
                                </div>
                                {prompt.metadata?.headline && (
                                  <CardTitle className="text-sm font-medium mb-1">
                                    {prompt.metadata.headline}
                                  </CardTitle>
                                )}
                                <CardDescription className="text-xs">
                                  {getPromptPreview(prompt.prompt_text)}
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePrompt.mutate(prompt.id)}
                              disabled={deletePrompt.isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{categories.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Used</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">
                      {Object.entries(stats)
                        .filter(([key]) => key !== 'total')
                        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'None'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats)
                      .filter(([key]) => key !== 'total')
                      .map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={categoryColors[category as keyof typeof categoryColors] || categoryColors.default}>
                              {categoryLabels[category as keyof typeof categoryLabels] || category}
                            </Badge>
                          </div>
                          <span className="text-sm font-medium">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Prompts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPrompts.size} selected prompts? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Prompts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all {selectedCategory ? `${selectedCategory} ` : ''}cached prompts? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};