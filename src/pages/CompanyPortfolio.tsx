
import { useParams, useNavigate } from "react-router-dom";
import { useCompanyPortfolio, useUpdateCompanyPortfolio, useGeneratePortfolioContent } from "@/hooks/useCompanyPortfolios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Wand2, Upload, Save, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PublicPortfolioView from "@/components/portfolio/PublicPortfolioView";

const CompanyPortfolio = () => {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const { data: portfolio, isLoading } = useCompanyPortfolio(companySlug || "");
  const updatePortfolio = useUpdateCompanyPortfolio();
  const generateContent = useGeneratePortfolioContent();

  const [user, setUser] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableContent, setEditableContent] = useState({
    hero_headline: "",
    hero_subheadline: "",
    value_proposition: "",
    cover_letter: "",
    custom_video_url: ""
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkAuth();
  }, []);

  // Determine if user can edit this portfolio
  const canEdit = user && portfolio && portfolio.user_id === user.id;

  useEffect(() => {
    if (portfolio) {
      const content = portfolio.generated_content as any || {};
      setEditableContent({
        hero_headline: content.hero_section?.headline || "",
        hero_subheadline: content.hero_section?.subheadline || "",
        value_proposition: content.hero_section?.value_proposition || "",
        cover_letter: portfolio.cover_letter || "",
        custom_video_url: portfolio.custom_video_url || ""
      });
    }
  }, [portfolio]);

  const handleGenerateContent = async () => {
    if (!portfolio?.job_applications?.job_description) {
      toast.error("No job description found to generate content from");
      return;
    }

    try {
      const result = await generateContent.mutateAsync(portfolio.job_applications.job_description);
      
      setEditableContent({
        hero_headline: result.hero_section?.headline || "",
        hero_subheadline: result.hero_section?.subheadline || "",
        value_proposition: result.hero_section?.value_proposition || "",
        cover_letter: result.cover_letter || "",
        custom_video_url: editableContent.custom_video_url
      });

      toast.success("Content generated successfully!");
    } catch (error) {
      console.error("Error generating content:", error);
    }
  };

  const handleSave = async () => {
    if (!portfolio) return;

    try {
      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        generated_content: {
          hero_section: {
            headline: editableContent.hero_headline,
            subheadline: editableContent.hero_subheadline,
            value_proposition: editableContent.value_proposition
          }
        },
        cover_letter: editableContent.cover_letter,
        custom_video_url: editableContent.custom_video_url,
        status: 'completed'
      });
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving portfolio:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Portfolio Not Found</h1>
          <Button onClick={() => navigate("/jobs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  // Show public view if not in edit mode or user can't edit
  if (!isEditMode || !canEdit) {
    return (
      <div className="relative">
        {canEdit && (
          <div className="fixed top-4 right-4 z-50">
            <Button onClick={() => setIsEditMode(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Portfolio
            </Button>
          </div>
        )}
        <PublicPortfolioView portfolio={portfolio} />
      </div>
    );
  }

  // Show edit mode for authenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setIsEditMode(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{portfolio.company_name} Portfolio</h1>
                <p className="text-muted-foreground">Editing mode - Tailored for {portfolio.company_name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGenerateContent}
                disabled={generateContent.isPending}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {generateContent.isPending ? "Generating..." : "Generate Content"}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updatePortfolio.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updatePortfolio.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Hero Section */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={editableContent.hero_headline}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, hero_headline: e.target.value }))}
                  placeholder="Your compelling headline..."
                />
              </div>
              <div>
                <Label htmlFor="subheadline">Subheadline</Label>
                <Input
                  id="subheadline"
                  value={editableContent.hero_subheadline}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                  placeholder="Supporting message..."
                />
              </div>
              <div>
                <Label htmlFor="value-prop">Value Proposition</Label>
                <Textarea
                  id="value-prop"
                  value={editableContent.value_proposition}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, value_proposition: e.target.value }))}
                  placeholder="What unique value do you bring..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Video Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="video-url">Video URL</Label>
                <Input
                  id="video-url"
                  value={editableContent.custom_video_url}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, custom_video_url: e.target.value }))}
                  placeholder="https://..."
                />
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Video
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editableContent.cover_letter}
                onChange={(e) => setEditableContent(prev => ({ ...prev, cover_letter: e.target.value }))}
                placeholder="Your personalized cover letter..."
                rows={12}
                className="min-h-[300px]"
              />
            </CardContent>
          </Card>

          {/* Job Description Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {portfolio.job_applications?.job_description || "No job description available"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyPortfolio;
