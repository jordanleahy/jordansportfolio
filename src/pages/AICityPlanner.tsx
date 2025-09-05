/**
 * AI CITY PLANNER - Main Page Component for Street Vision Feature
 * 
 * OVERVIEW:
 * This is the main orchestrator component for the Street Vision feature, which allows users
 * to upload street photos and transform them into AI-generated visions of safer, more livable
 * urban spaces. It coordinates all UI components and manages the complete workflow from
 * image upload to result display.
 * 
 * WORKFLOW COORDINATION:
 * 1. Image Upload Phase: User selects/uploads a street photo
 * 2. Prompt Input Phase: User describes their transformation vision
 * 3. Processing Phase: Triggers AI transformation via edge function
 * 4. Results Phase: Displays original vs transformed images with analysis
 * 
 * STATE MANAGEMENT:
 * - imagePath: Storage path of uploaded image in Supabase
 * - imageUrl: Public URL for displaying the uploaded image
 * - originalFilename: Original filename for user reference
 * - prompt: User's transformation description text
 * - isUploading: Loading state during image upload process
 * 
 * KEY INTEGRATIONS:
 * - useStreetVisionProcessing: Custom hook managing AI processing workflow
 * - ImageUploadArea: Component handling drag/drop, file selection, storage upload
 * - PromptInput: Component for user input with validation and UX features
 * - StreetVisionResults: Component displaying transformation results and analysis
 * 
 * ERROR HANDLING:
 * - Validates image upload before processing
 * - Validates prompt input before processing
 * - Shows user-friendly error messages via toast notifications
 * - Provides retry functionality for failed processing
 * 
 * DATABASE INTEGRATION:
 * - Connects to Supabase storage for image persistence
 * - Tracks processing records via useStreetVisionProcessing hook
 * - Real-time updates for processing status changes
 */

import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ImageUploadArea } from '@/components/ai-city-planner/ImageUploadArea';
import { PromptInput } from '@/components/ai-city-planner/PromptInput';
import { RunButton } from '@/components/ai-city-planner/RunButton';
import { StreetVisionResults } from '@/components/ai-city-planner/StreetVisionResults';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useStreetVisionProcessing } from '@/hooks/useStreetVisionProcessing';
import { supabase } from '@/integrations/supabase/client';

/**
 * Main AI City Planner page component
 * Orchestrates the entire Street Vision transformation workflow
 */
const AICityPlanner: React.FC = () => {
  // Local state for UI components
  const [imagePath, setImagePath] = useState<string>('');       // Supabase storage path
  const [imageUrl, setImageUrl] = useState<string>('');         // Public URL for display
  const [originalFilename, setOriginalFilename] = useState<string>(''); // User reference
  const [prompt, setPrompt] = useState<string>('');             // Transformation description
  const [isUploading, setIsUploading] = useState(false);        // Upload loading state
  
  // Processing state and actions from custom hook
  const { 
    currentRecord,    // Database record with processing status and results
    isProcessing,     // Boolean indicating if AI transformation is active
    startProcessing,  // Function to initiate the AI transformation workflow
    clearProcessing,  // Function to reset processing state and cleanup
    error            // Error message if processing fails
  } = useStreetVisionProcessing();

  /**
   * Handles successful image upload from ImageUploadArea component
   * Updates local state with image details for processing and display
   * 
   * @param path - Supabase storage path of the uploaded image
   * @param filename - Original filename for user reference
   */
  const handleImageUpload = async (path: string, filename: string) => {
    setIsUploading(true);
    try {
      // Get public URL for immediate display in UI
      const { data } = supabase.storage
        .from('street-vision')
        .getPublicUrl(path);
      
      // Update state with image details
      setImagePath(path);           // Storage path needed for processing
      setImageUrl(data.publicUrl);  // Public URL for display
      setOriginalFilename(filename); // User-friendly filename
    } catch (error) {
      console.error('Failed to get image URL:', error);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Removes currently uploaded image and resets related state
   * Also clears any ongoing or completed processing
   */
  const handleRemoveImage = () => {
    setImagePath('');       // Clear storage path
    setImageUrl('');        // Clear display URL
    setOriginalFilename(''); // Clear filename
    clearProcessing();      // Reset processing state via hook
  };

  /**
   * Initiates the AI street transformation process
   * Validates inputs and triggers the street-vision-agent edge function
   */
  const handleRun = async () => {
    // Validate required image upload
    if (!imagePath) {
      toast({
        title: "Image required",
        description: "Please upload a street photo first",
        variant: "destructive",
      });
      return;
    }

    // Validate required prompt input
    if (!prompt.trim()) {
      toast({
        title: "Prompt required", 
        description: "Please describe your vision for the street transformation",
        variant: "destructive",
      });
      return;
    }

    // Trigger processing workflow via custom hook
    // This will: 1) Call edge function, 2) Create DB record, 3) Setup real-time updates
    await startProcessing(imagePath, prompt.trim(), originalFilename);
  };

  /**
   * Retries failed processing with current image and prompt
   * Clears previous state and re-initiates the workflow
   */
  const handleRetry = () => {
    if (imagePath && prompt.trim()) {
      clearProcessing(); // Reset processing state and cleanup subscriptions
      handleRun();       // Re-trigger the AI transformation
    }
  };

  const canRun = imagePath && prompt.trim() && !isProcessing && !isUploading;

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Street Vision</h1>
                <p className="text-sm text-muted-foreground">
                  Transform streets into safer, more livable spaces
                </p>
              </div>
              <RunButton
                onClick={handleRun}
                disabled={!canRun}
                loading={isProcessing}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Input Section - Hide when processing starts */}
            {!currentRecord && (
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-6">
                  
                  {/* Image Upload */}
                  <div>
                    <h2 className="text-lg font-medium mb-4 text-foreground">Street Photo</h2>
          <ImageUploadArea
            onImageUpload={handleImageUpload}
            uploadedImageUrl={imageUrl}
            onRemoveImage={handleRemoveImage}
            isUploading={isUploading}
          />
                  </div>

                  {/* Prompt Input */}
                  <div>
                    <PromptInput
                      value={prompt}
                      onChange={setPrompt}
                      onEnterPress={canRun ? handleRun : undefined}
                      disabled={isProcessing}
                    />
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            <StreetVisionResults
              record={currentRecord}
              isProcessing={isProcessing}
              error={error}
              originalImageUrl={imageUrl}
              onRetry={handleRetry}
            />

          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AICityPlanner;