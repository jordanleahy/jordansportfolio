import React from "react";
import { Helmet } from "react-helmet-async";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";

const AscertainToTheMoon = () => {
  return (
    <>
      <Helmet>
        <title>Cover Letter - Ascertain to the Moon</title>
        <meta name="description" content="A personal cover letter and introduction" />
      </Helmet>
      <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-background/90 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Welcome to the Moon
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A personal cover letter and introduction
            </p>
          </div>

          {/* Video Section */}
          <Card className="mb-12">
            <CardContent className="p-6">
              <div className="mx-auto max-w-sm">
                <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">9:16 Video</p>
                    <p className="text-sm text-muted-foreground">Upload your introduction video</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter Content */}
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-semibold mb-6">Dear Hiring Team,</h2>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>
                    Your cover letter content will go here. This is where you can share your 
                    passion, experience, and why you're the perfect fit for this opportunity.
                  </p>
                  
                  <p>
                    Add multiple paragraphs to tell your story, highlight your achievements, 
                    and demonstrate your enthusiasm for the role.
                  </p>
                  
                  <p>
                    This page serves as a creative, interactive cover letter that showcases 
                    both your technical skills and personality.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <p className="text-lg font-medium">
                    Best regards,<br />
                    Your Name
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
    </>
  );
};

export default AscertainToTheMoon;