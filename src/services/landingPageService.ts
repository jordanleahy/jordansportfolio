
import { supabase } from "@/integrations/supabase/client";
import { JobApplication } from "@/types/jobApplication";
import { GeneratedContent } from "@/types/companyPortfolio";

// Helper function to detect role type from job description
const detectRoleType = (jobDescription: string): 'product_manager' | 'product_designer' => {
  const description = jobDescription.toLowerCase();
  const pmKeywords = ['product manager', 'product management', 'pm ', 'product strategy', 'roadmap', 'stakeholder'];
  const designKeywords = ['product designer', 'ux designer', 'ui designer', 'design', 'figma', 'prototype', 'user experience'];
  
  const pmScore = pmKeywords.reduce((score, keyword) => score + (description.includes(keyword) ? 1 : 0), 0);
  const designScore = designKeywords.reduce((score, keyword) => score + (description.includes(keyword) ? 1 : 0), 0);
  
  return designScore > pmScore ? 'product_designer' : 'product_manager';
};

export const generateLandingPageContent = async (
  jobApplication: JobApplication,
  roleType?: 'product_manager' | 'product_designer'
): Promise<GeneratedContent> => {
  try {
    // Get the current user for personalization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User authentication required for content generation');
    }

    // Detect role type if not provided
    const detectedRoleType = roleType || detectRoleType(jobApplication.job_description || '');

    console.log('Calling cover-letter-agent function with data:', {
      jobDescription: jobApplication.job_description?.substring(0, 100) + '...',
      companyName: jobApplication.company_name,
      roleType: detectedRoleType,
      userId: user.id
    });

    const { data, error } = await supabase.functions.invoke("cover-letter-agent", {
      body: { 
        jobDescription: jobApplication.job_description,
        companyName: jobApplication.company_name,
        roleType: detectedRoleType,
        userId: user.id
      },
    });

    if (error) {
      console.error('Cover letter agent error:', error);
      
      // Fallback to old system if agent fails
      console.log('Falling back to generate-portfolio-content...');
      const fallbackData = await supabase.functions.invoke("generate-portfolio-content", {
        body: { 
          jobDescription: jobApplication.job_description,
          companyName: jobApplication.company_name,
          jobDescriptionLink: jobApplication.job_description_link,
          userId: user.id
        },
      });
      
      if (fallbackData.error) {
        throw new Error(`Both agent and fallback failed: ${error.message}`);
      }
      
      return { cover_letter: fallbackData.data.cover_letter };
    }

    if (!data || !data.success) {
      throw new Error('No valid data returned from cover letter agent');
    }

    console.log('Generated cover letter successfully with agent', {
      caseStudiesUsed: data.caseStudiesUsed || 0,
      roleType: detectedRoleType
    });
    
    return { cover_letter: data.coverLetter };
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
    
    // Generate AI-powered cover letter
    const generatedContent = await generateLandingPageContent(jobApplication);
    
    console.log('🚀 Content generated, creating portfolio record...');
    
    // Create or update the portfolio with generated content
    const { data, error } = await supabase
      .from("company_portfolios")
      .upsert({
        job_application_id: jobApplication.id,
        company_name: jobApplication.company_name,
        company_slug: companySlug,
        generated_content: generatedContent as any,
        cover_letter: typeof generatedContent.cover_letter === 'string' 
          ? generatedContent.cover_letter 
          : JSON.stringify(generatedContent.cover_letter),
        status: 'completed' as const,
        user_id: user.id
      }, {
        onConflict: 'user_id,company_slug'
      })
      .select()
      .single();

    if (error) {
      console.error('🚀 Database insert error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('🚀 Portfolio created successfully:', data?.id);
    
    // Add a small delay to ensure the database transaction is fully committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return data;
  } catch (error: any) {
    console.error("🚀 Error creating personalized portfolio:", error);
    
    // Preserve original error message for better debugging
    throw error;
  }
};
