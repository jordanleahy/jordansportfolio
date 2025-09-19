import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, ArrowRight, ArrowDown, Image, FileText } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  description: string;
  day?: number;
  image_16_9_url?: string;
}

interface StoryFlowVisualizerProps {
  posts: Post[];
  postOrder: string[];
  onReorder: (newOrder: string[]) => void;
}

export const StoryFlowVisualizer: React.FC<StoryFlowVisualizerProps> = ({
  posts,
  postOrder,
  onReorder
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');

  const orderedPosts = postOrder
    .map(id => posts.find(p => p.id === id))
    .filter(Boolean) as Post[];

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(postOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  const getSectionLabel = (index: number, total: number) => {
    if (index === 0) return 'Introduction';
    if (index === total - 1) return 'Conclusion';
    if (index <= Math.floor(total / 3)) return 'Foundation';
    if (index <= Math.floor((total * 2) / 3)) return 'Development';
    return 'Resolution';
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-accent/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5 text-accent" />
            <span>Story Flow & Structure</span>
          </CardTitle>
          
          <div className="flex rounded-lg border bg-card p-1">
            {[
              { key: 'timeline', label: 'Timeline' },
              { key: 'grid', label: 'Grid' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key as any)}
                className={`px-3 py-1 text-sm rounded font-medium transition-all ${
                  viewMode === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Drag and drop to reorder how your posts will flow in the story
        </p>
      </CardHeader>

      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="story-flow">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-4 transition-colors ${
                  snapshot.isDraggingOver ? 'bg-accent/5 rounded-lg p-4' : ''
                }`}
              >
                {orderedPosts.map((post, index) => (
                  <Draggable key={post.id} draggableId={post.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all ${
                          snapshot.isDragging 
                            ? 'rotate-1 scale-105 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                      >
                        <Card className={`relative overflow-hidden ${
                          snapshot.isDragging 
                            ? 'bg-primary/5 border-primary/30' 
                            : 'hover:bg-accent/5 hover:border-accent/30'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              {/* Drag Handle */}
                              <div 
                                {...provided.dragHandleProps}
                                className="flex-shrink-0 mt-1 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>

                              {/* Post Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs">
                                      {getSectionLabel(index, orderedPosts.length)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Section {index + 1}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 text-muted-foreground">
                                    {post.image_16_9_url && (
                                      <Image className="h-3 w-3" />
                                    )}
                                    <FileText className="h-3 w-3" />
                                  </div>
                                </div>

                                <h4 className="font-semibold text-foreground mb-1 line-clamp-2">
                                  {post.title}
                                </h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {post.description}
                                </p>

                                {post.day && (
                                  <div className="mt-2">
                                    <Badge variant="secondary" className="text-xs">
                                      Day {post.day}
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              {/* Visual Connection */}
                              {index < orderedPosts.length - 1 && (
                                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                                  <div className="bg-background border rounded-full p-1">
                                    <ArrowDown className="h-3 w-3 text-accent" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Flow Summary */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Story Structure: {orderedPosts.length} sections
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">
                Estimated reading: ~{Math.ceil(orderedPosts.length * 1.5)} minutes
              </span>
              <Badge variant="outline" className="border-accent/50 text-accent">
                Ready to Generate
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};