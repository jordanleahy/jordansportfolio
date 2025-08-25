import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import BookHighlightsInput from '@/components/BookHighlights/BookHighlightsInput';
import BookHighlightsResults from '@/components/BookHighlights/BookHighlightsResults';
import { useBookHighlights } from '@/hooks/useBookHighlights';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Trash2, BookOpen, Calendar } from "lucide-react";
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
    clearCurrentResults
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

  const handleSelectPreviousResearch = (highlight: any) => {
    // Set the selected highlight as current results
    clearCurrentResults();
    setTimeout(() => {
      // Simulate setting it as current results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

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
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5" />
                Research History
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
                      <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
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
                              {highlight.verified_quotes.length} quotes
                            </Badge>
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