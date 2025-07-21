
import { supabase } from "@/integrations/supabase/client";
import { JobApplication } from "@/types/jobApplication";
import { GeneratedContent } from "@/types/companyPortfolio";

export const generateLandingPageContent = async (
  jobApplication: JobApplication
): Promise<GeneratedContent> => {
  try {
    console.log('Calling generate-portfolio-content function with data:', {
      jobDescription: jobApplication.job_description?.substring(0, 100) + '...',
      companyName: jobApplication.company_name,
      hasJobLink: !!jobApplication.job_description_link
    });

    const { data, error } = await supabase.functions.invoke("generate-portfolio-content", {
      body: { 
        jobDescription: jobApplication.job_description,
        companyName: jobApplication.company_name,
        jobDescriptionLink: jobApplication.job_description_link
      },
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Function error: ${error.message || 'Unknown error'}`);
    }

    if (!data) {
      throw new Error('No data returned from portfolio content generation');
    }

    console.log('Generated content successfully:', Object.keys(data));
    return data;
  } catch (error: any) {
    console.error("Error generating landing page content:", error);
    
    // Re-throw with more context
    if (error.message?.includes('Invalid Refresh Token')) {
      throw new Error('Authentication expired. Please sign in again.');
    } else if (error.message?.includes('fetch')) {
      throw new Error('Network error occurred. Please check your connection.');
    } else {
      throw new Error(`Content generation failed: ${error.message || 'Unknown error'}`);
    }
  }
};

export const createPersonalizedPortfolio = async (
  jobApplication: JobApplication,
  companySlug: string
) => {
  try {
    console.log('Starting portfolio creation process...');
    
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth check error:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('User authenticated, generating content...');
    
    // Generate AI-powered content
    const generatedContent = await generateLandingPageContent(jobApplication);
    
    console.log('Content generated, creating portfolio record...');
    
    // Create the portfolio with generated content
    const { data, error } = await supabase
      .from("company_portfolios")
      .insert({
        job_application_id: jobApplication.id,
        company_name: jobApplication.company_name,
        company_slug: companySlug,
        generated_content: generatedContent as any,
        cover_letter: generatedContent.cover_letter,
        status: 'completed' as const,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Portfolio created successfully:', data?.id);
    return data;
  } catch (error: any) {
    console.error("Error creating personalized portfolio:", error);
    
    // Preserve original error message for better debugging
    throw error;
  }
};
