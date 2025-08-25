import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookHighlightRecord {
  id: string;
  user_id: string;
  original_input: string;
  book_title: string;
  book_author: string;
  verified_quotes: any[];
  verification_confidence: 'high' | 'medium' | 'low';
  source_references: any[];
  visual_prompts: string[];
  image_urls: string[];
  processing_status: 'pending' | 'researching' | 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface BookResearchResult {
  success: boolean;
  data: BookHighlightRecord;
  research_results: any;
  visual_count: number;
  image_count: number;
}

export const useBookHighlights = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [currentResults, setCurrentResults] = useState<BookHighlightRecord | null>(null);
  const [userHighlights, setUserHighlights] = useState<BookHighlightRecord[]>([]);

  const researchBook = async (userInput: string): Promise<BookHighlightRecord | null> => {
    if (!userInput.trim()) {
      toast.error('Please enter a book research request');
      return null;
    }

    setIsProcessing(true);
    setProcessingStatus('Starting research...');

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Please sign in to research book highlights');
        return null;
      }

      setProcessingStatus('Researching book and quotes...');

      // Call the research edge function
      const { data, error } = await supabase.functions.invoke('research-book-highlights', {
        body: {
          user_input: userInput,
          user_id: user.id
        }
      });

      if (error) {
        console.error('Research error:', error);
        toast.error('Failed to research book highlights. Please try again.');
        return null;
      }

      const result = data as BookResearchResult;
      
      if (!result.success) {
        toast.error(result.data ? 'Research completed with some issues' : 'Failed to research book highlights');
        return null;
      }

      setCurrentResults(result.data);
      toast.success(`Successfully researched "${result.data.book_title}" with ${result.data.verified_quotes.length} quotes and ${result.image_count} visualizations`);
      
      // Refresh user highlights
      await fetchUserHighlights();
      
      return result.data;

    } catch (error) {
      console.error('Error in book research:', error);
      toast.error('Unexpected error during research. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const fetchUserHighlights = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return;
      }

      const { data, error } = await supabase
        .from('verified_book_highlights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user highlights:', error);
        return;
      }

      setUserHighlights((data as BookHighlightRecord[]) || []);
    } catch (error) {
      console.error('Error fetching user highlights:', error);
    }
  };

  const deleteHighlight = async (highlightId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('verified_book_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) {
        console.error('Error deleting highlight:', error);
        toast.error('Failed to delete highlight');
        return false;
      }

      toast.success('Highlight deleted successfully');
      await fetchUserHighlights();
      
      // Clear current results if it was the deleted highlight
      if (currentResults?.id === highlightId) {
        setCurrentResults(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting highlight:', error);
      toast.error('Failed to delete highlight');
      return false;
    }
  };

  const clearCurrentResults = () => {
    setCurrentResults(null);
  };

  return {
    isProcessing,
    processingStatus,
    currentResults,
    userHighlights,
    researchBook,
    fetchUserHighlights,
    deleteHighlight,
    clearCurrentResults
  };
};