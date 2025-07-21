
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
    console.log('🚀 Starting portfolio creation process...');
    console.log('🚀 Job application details:', {
      id: jobApplication.id,
      company_name: jobApplication.company_name,
      user_id: jobApplication.user_id,
      job_description_length: jobApplication.job_description?.length || 0
    });
    
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('🚀 Auth check error:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('🚀 User authenticated, generating content...');
    console.log('🚀 Current user ID:', user.id);
    console.log('🚀 Job application user ID:', jobApplication.user_id);
    
    // Verify the job application exists and belongs to the user
    const { data: existingApp, error: appError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', jobApplication.id)
      .eq('user_id', user.id)
      .single();
    
    if (appError) {
      console.error('🚀 Job application verification error:', appError);
      throw new Error(`Job application not found: ${appError.message}`);
    }
    
    if (!existingApp) {
      throw new Error('Job application not found or access denied');
    }
    
    console.log('🚀 Job application verified:', existingApp.id);
    
    // Generate AI-powered content
    const generatedContent = await generateLandingPageContent(jobApplication);
    
    console.log('🚀 Content generated, creating portfolio record...');
    console.log('🚀 About to upsert with:', {
      job_application_id: jobApplication.id,
      company_name: jobApplication.company_name,
      company_slug: companySlug,
      user_id: user.id,
      content_keys: Object.keys(generatedContent)
    });
    
    // Create or update the portfolio with generated content
    const { data, error } = await supabase
      .from("company_portfolios")
      .upsert({
        job_application_id: jobApplication.id,
        company_name: jobApplication.company_name,
        company_slug: companySlug,
        generated_content: generatedContent as any,
        cover_letter: generatedContent.cover_letter,
        status: 'completed' as const,
        user_id: user.id
      }, {
        onConflict: 'user_id,company_slug'
      })
      .select()
      .single();

    if (error) {
      console.error('🚀 Database insert error:', error);
      console.error('🚀 Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('🚀 Portfolio created successfully:', data?.id);
    console.log('🚀 Portfolio data:', {
      id: data?.id,
      company_slug: data?.company_slug,
      user_id: data?.user_id,
      job_application_id: data?.job_application_id
    });
    
    // Add a small delay to ensure the database transaction is fully committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return data;
  } catch (error: any) {
    console.error("🚀 Error creating personalized portfolio:", error);
    
    // Preserve original error message for better debugging
    throw error;
  }
};
