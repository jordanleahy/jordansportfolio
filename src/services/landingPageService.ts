
import { supabase } from "@/integrations/supabase/client";
import { JobApplication } from "@/types/jobApplication";
import { GeneratedContent } from "@/types/companyPortfolio";

export const generateLandingPageContent = async (
  jobApplication: JobApplication
): Promise<GeneratedContent> => {
  try {
    const { data, error } = await supabase.functions.invoke("generate-portfolio-content", {
      body: { 
        jobDescription: jobApplication.job_description,
        companyName: jobApplication.company_name,
        jobDescriptionLink: jobApplication.job_description_link
      },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error generating landing page content:", error);
    throw error;
  }
};

export const createPersonalizedPortfolio = async (
  jobApplication: JobApplication,
  companySlug: string
) => {
  try {
    // Generate AI-powered content
    const generatedContent = await generateLandingPageContent(jobApplication);
    
    // Create the portfolio with generated content
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

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

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating personalized portfolio:", error);
    throw error;
  }
};
