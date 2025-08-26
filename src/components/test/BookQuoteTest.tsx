import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInputTriage } from '@/hooks/useInputTriage';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BookOpen, Search, Quote } from 'lucide-react';

export const BookQuoteTest = () => {
  const [testInput, setTestInput] = useState('Find me key quotes from "Good to Great" by Jim Collins');
  const [bookResearchResult, setBookResearchResult] = useState<any>(null);
  const [isResearching, setIsResearching] = useState(false);
  
  const { 
    analyzeInput, 
    isAnalyzing, 
    currentRoute, 
    error,
    getRouteDescription,
    getConfidenceLabel 
  } = useInputTriage();

  const handleTriageTest = async () => {
    console.log('Starting triage test with input:', testInput);
    
    const result = await analyzeInput({
      input: testInput,
      onRouteDecision: (route) => {
        console.log('Route decision received:', route);
        
        // If routed to book research, trigger the book research agent
        if (route.primary_route === 'book_research') {
          handleBookResearch();
        }
      }
    });
    
    console.log('Triage analysis result:', result);
  };

  const handleBookResearch = async () => {
    setIsResearching(true);
    console.log('Triggering book research for:', testInput);
    
    try {
      // Call the book research edge function
      const { data, error } = await supabase.functions.invoke('research-book-highlights', {
        body: { 
          query: testInput,
          research_type: 'book_identification_and_quotes'
        }
      });

      if (error) {
        console.error('Book research error:', error);
        throw error;
      }

      console.log('Book research completed:', data);
      setBookResearchResult(data);
      
    } catch (error) {
      console.error('Failed to research book:', error);
    } finally {
      setIsResearching(false);
    }
  };

  const testCases = [
    'Find me key quotes from "Good to Great" by Jim Collins',
    'I need highlights from Steve Jobs most recent book',
    'Research quotes from "The Lean Startup" for my presentation',
    'Get me the best quotes from Bill Gates latest book',
    'Find inspiring quotes from "Atomic Habits" by James Clear'
  ];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Book Quote Research - End-to-End Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Test Input:</label>
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter a book research request..."
              className="min-h-[80px]"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Quick tests:</span>
            {testCases.map((testCase, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setTestInput(testCase)}
                className="text-xs"
              >
                Test {index + 1}
              </Button>
            ))}
          </div>

          <Button 
            onClick={handleTriageTest} 
            disabled={isAnalyzing || isResearching || !testInput.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Input...
              </>
            ) : isResearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Researching Book...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Start End-to-End Test
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Triage Results */}
      {currentRoute && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Triage Analysis Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Route: {getRouteDescription(currentRoute.primary_route)}
              </Badge>
              <Badge variant={currentRoute.confidence >= 0.8 ? 'default' : currentRoute.confidence >= 0.5 ? 'secondary' : 'destructive'}>
                Confidence: {getConfidenceLabel(currentRoute.confidence)} ({Math.round(currentRoute.confidence * 100)}%)
              </Badge>
            </div>
            
            <div>
              <strong>Reasoning:</strong> {currentRoute.reasoning}
            </div>

            <div>
              <strong>Classification:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(currentRoute.input_classification).map(([key, value]) => (
                  <Badge key={key} variant={value ? 'default' : 'outline'} className="text-xs">
                    {key.replace(/_/g, ' ')}: {value ? 'Yes' : 'No'}
                  </Badge>
                ))}
              </div>
            </div>

            {currentRoute.suggested_preprocessing && (
              <div>
                <strong>Preprocessing:</strong> {currentRoute.suggested_preprocessing}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Book Research Results */}
      {bookResearchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5" />
              Book Research Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookResearchResult.book_identification && (
                <div>
                  <h4 className="font-semibold mb-2">Book Information:</h4>
                  <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                    <div><strong>Title:</strong> {bookResearchResult.book_identification.title}</div>
                    <div><strong>Author:</strong> {bookResearchResult.book_identification.author}</div>
                    <div><strong>Year:</strong> {bookResearchResult.book_identification.publication_year}</div>
                    <div><strong>Confidence:</strong> {bookResearchResult.book_identification.confidence}</div>
                  </div>
                </div>
              )}

              {bookResearchResult.verified_quotes && bookResearchResult.verified_quotes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Verified Quotes:</h4>
                  <div className="space-y-3">
                    {bookResearchResult.verified_quotes.map((quote: any, index: number) => (
                      <div key={index} className="border-l-4 border-primary pl-4">
                        <blockquote className="italic text-muted-foreground mb-2">
                          "{quote.quote_text}"
                        </blockquote>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div><strong>Confidence:</strong> {quote.confidence}</div>
                          {quote.page_reference && <div><strong>Page:</strong> {quote.page_reference}</div>}
                          {quote.context && <div><strong>Context:</strong> {quote.context}</div>}
                          {quote.sources && quote.sources.length > 0 && (
                            <div><strong>Sources:</strong> {quote.sources.length} verified</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookResearchResult.research_metadata && (
                <div>
                  <h4 className="font-semibold mb-2">Research Metadata:</h4>
                  <div className="bg-muted p-3 rounded-md text-xs space-y-1">
                    <div><strong>Sources Checked:</strong> {bookResearchResult.research_metadata.total_sources_checked}</div>
                    <div><strong>Research Confidence:</strong> {bookResearchResult.research_metadata.research_confidence}</div>
                    <div><strong>Timestamp:</strong> {new Date(bookResearchResult.research_metadata.research_timestamp).toLocaleString()}</div>
                    {bookResearchResult.research_metadata.verification_notes && (
                      <div><strong>Notes:</strong> {bookResearchResult.research_metadata.verification_notes}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};