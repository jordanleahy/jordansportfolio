import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import BookHighlightsInput from '@/components/BookHighlights/BookHighlightsInput';
import BookHighlightsResults from '@/components/BookHighlights/BookHighlightsResults';
import { useBookHighlights } from '@/hooks/useBookHighlights';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Trash2, BookOpen, Calendar, RefreshCcw, AlertTriangle } from "lucide-react";
import { format } from 'date-fns';

const BookHighlights: React.FC = () => {
  const {
    isProcessing,
    processingStatus,
    currentResults,
    userHighlights,
    researchBook,
    fetchUserHighlights,
    deleteHighlight,
    clearCurrentResults,
    recoverStuckHighlights,
    isRecovering
  } = useBookHighlights();

  useEffect(() => {
    fetchUserHighlights();
  }, []);

  const handleNewSearch = () => {
    clearCurrentResults();
  };

  const handleResearchSubmit = async (input: string) => {
    await researchBook(input);
  };

  const handleRecoverStuck = async () => {
    try {
      await recoverStuckHighlights();
      // Refresh the highlights after recovery
      await fetchUserHighlights();
    } catch (error) {
      console.error('Recovery failed:', error);
    }
  };

  // Check if there are any stuck highlights
  const hasStuckHighlights = userHighlights.some(h => h.processing_status === 'researching');

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold text-foreground">
          Book Highlights Research
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Research and visualize key quotes and insights from any book. 
          Get verified quotes with sources and AI-generated visual representations.
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Area */}
        <div className="lg:col-span-3 space-y-8">
          {!currentResults ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <BookHighlightsInput
                onSubmit={handleResearchSubmit}
                isProcessing={isProcessing}
                processingStatus={processingStatus}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <BookHighlightsResults
                bookTitle={currentResults.book_title}
                bookAuthor={currentResults.book_author}
                quotes={currentResults.verified_quotes}
                visualPrompts={currentResults.visual_prompts}
                imageUrls={currentResults.image_urls}
                verificationConfidence={currentResults.verification_confidence}
                onNewSearch={handleNewSearch}
              />
            </motion.div>
          )}
        </div>

        {/* Sidebar - Research History */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Research History
                </div>
                {hasStuckHighlights && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecoverStuck}
                    disabled={isRecovering}
                    className="text-xs"
                  >
                    {isRecovering ? (
                      <RefreshCcw className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {isRecovering ? 'Fixing...' : 'Fix Stuck'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userHighlights.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No research history yet. Start by researching your first book!
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userHighlights.map((highlight) => (
                    <motion.div
                      key={highlight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group"
                    >
                      <Card className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${
                        highlight.processing_status === 'researching' ? 'border-amber-200 bg-amber-50/50' : 
                        highlight.processing_status === 'failed' ? 'border-red-200 bg-red-50/50' : ''
                      }`}>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm text-foreground truncate">
                                {highlight.book_title}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">
                                by {highlight.book_author}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHighlight(highlight.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {highlight.verified_quotes?.length || 0} quotes
                            </Badge>
                            <div className="flex gap-1">
                              {highlight.processing_status === 'researching' && (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                                  Processing...
                                </Badge>
                              )}
                              {highlight.processing_status === 'failed' && (
                                <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                  Failed
                                </Badge>
                              )}
                              {highlight.processing_status === 'completed' && (
                                <Badge
                                  variant="outline"
                                  className={
                                    highlight.verification_confidence === 'high'
                                      ? 'text-emerald-600 border-emerald-200'
                                      : highlight.verification_confidence === 'medium'
                                      ? 'text-amber-600 border-amber-200'
                                      : 'text-red-600 border-red-200'
                                  }
                                >
                                  {highlight.verification_confidence}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(highlight.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookHighlights;