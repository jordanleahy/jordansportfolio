import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Share2, BookOpen, Quote, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface QuoteData {
  quote_text: string;
  confidence: 'high' | 'medium' | 'low';
  sources: Array<{
    source_type: string;
    url: string;
    title: string;
  }>;
  page_reference?: string;
  context: string;
}

interface BookHighlightsResultsProps {
  bookTitle: string;
  bookAuthor: string;
  quotes: QuoteData[];
  visualPrompts: string[];
  imageUrls: string[];
  verificationConfidence: 'high' | 'medium' | 'low';
  onNewSearch: () => void;
}

const confidenceColors = {
  high: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-200', 
  low: 'bg-red-500/10 text-red-700 border-red-200'
};

const confidenceIcons = {
  high: CheckCircle,
  medium: AlertCircle,
  low: XCircle
};

const BookHighlightsResults: React.FC<BookHighlightsResultsProps> = ({
  bookTitle,
  bookAuthor,
  quotes,
  visualPrompts,
  imageUrls,
  verificationConfidence,
  onNewSearch
}) => {
  const ConfidenceIcon = confidenceIcons[verificationConfidence];

  const handleExportResults = () => {
    const exportData = {
      book: { title: bookTitle, author: bookAuthor },
      quotes,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_highlights.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book Highlights: ${bookTitle}`,
          text: `Check out these key insights from "${bookTitle}" by ${bookAuthor}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `Book Highlights: "${bookTitle}" by ${bookAuthor}\n\n${quotes.slice(0, 3).map(q => `"${q.quote_text}"`).join('\n\n')}`;
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Book Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">{bookTitle}</CardTitle>
                <p className="text-lg text-muted-foreground mt-1">by {bookAuthor}</p>
                <div className="flex items-center gap-2 mt-3">
                  <ConfidenceIcon className="h-4 w-4" />
                  <Badge className={confidenceColors[verificationConfidence]}>
                    {verificationConfidence.toUpperCase()} Confidence
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {quotes.length} quotes found
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShareResults}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportResults}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={onNewSearch}>
                Search New Book
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quotes.map((quote, index) => {
          const QuoteConfidenceIcon = confidenceIcons[quote.confidence];
          const hasImage = imageUrls[index] && imageUrls[index].length > 0;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <Quote className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div className="flex items-center gap-2">
                      <QuoteConfidenceIcon className="h-4 w-4" />
                      <Badge variant="outline" className={confidenceColors[quote.confidence]}>
                        {quote.confidence}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Generated Image */}
                  {hasImage && (
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={imageUrls[index]} 
                        alt={`Visual representation of: ${quote.quote_text.slice(0, 50)}...`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Quote Text */}
                  <blockquote className="text-lg font-medium text-foreground leading-relaxed border-l-4 border-primary pl-4">
                    "{quote.quote_text}"
                  </blockquote>
                  
                  {/* Context */}
                  {quote.context && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <strong>Context:</strong> {quote.context}
                    </p>
                  )}
                  
                  {/* Page Reference */}
                  {quote.page_reference && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Reference:</strong> {quote.page_reference}
                    </p>
                  )}
                  
                  {/* Sources */}
                  {quote.sources && quote.sources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Sources:</p>
                      <div className="space-y-1">
                        {quote.sources.slice(0, 2).map((source, sourceIndex) => (
                          <a
                            key={sourceIndex}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate">{source.title}</span>
                          </a>
                        ))}
                        {quote.sources.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{quote.sources.length - 2} more sources
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BookHighlightsResults;