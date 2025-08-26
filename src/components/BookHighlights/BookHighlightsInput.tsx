import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface BookHighlightsInputProps {
  onSubmit: (input: string) => void;
  isProcessing: boolean;
  processingStatus?: string;
}

const BookHighlightsInput: React.FC<BookHighlightsInputProps> = ({
  onSubmit,
  isProcessing,
  processingStatus = "Processing..."
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSubmit(input.trim());
    }
  };

  const exampleQueries = [
    "Get me quotes from Bill Gates' most recent book",
    "Find highlights from Good to Great by Jim Collins",
    "Show me key insights from The Lean Startup",
    "Research quotes from Simon Sinek's latest leadership book"
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">
          Book Highlights Research & Visualization
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Research and visualize key quotes and insights from any book. Just describe what you're looking for.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="e.g., 'Get me quotes from Bill Gates' most recent book'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              className="pl-10 h-12 text-base"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={!input.trim() || isProcessing}
            className="w-full h-12 text-base font-medium"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processingStatus}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Research Book Highlights
              </>
            )}
          </Button>
        </form>

        {/* Example queries */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Try these examples:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exampleQueries.map((query, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !isProcessing && setInput(query)}
                disabled={isProcessing}
                className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-sm text-foreground font-medium">{query}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookHighlightsInput;