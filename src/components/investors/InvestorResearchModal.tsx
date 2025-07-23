import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Download, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InvestorResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvestorsAdded?: (count: number) => void;
}

export const InvestorResearchModal = ({ isOpen, onClose, onInvestorsAdded }: InvestorResearchModalProps) => {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [step, setStep] = useState<'prompt' | 'import'>('prompt');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [importJson, setImportJson] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);

  // Admin check
  if (!isAdmin) {
    return null;
  }

  const generateInvestorPrompt = () => {
    const prompt = `You are an expert investment research analyst with advanced web browsing capabilities. Your task is to conduct comprehensive research on venture capital firms, private equity firms, angel investor groups, and other investment organizations. Extract detailed information that matches our exact database schema.

**RESEARCH METHODOLOGY:**
1. Search and analyze multiple sources including:
   - Firm websites and portfolio pages
   - Crunchbase, PitchBook, and other investment databases
   - News articles and press releases about recent investments
   - LinkedIn profiles of key partners and team members
   - SEC filings and regulatory documents (if applicable)
   - Industry reports and market analyses

2. For each investment firm, gather information from:
   - Homepage and about sections
   - Portfolio companies and case studies
   - Team and partner profiles
   - Investment thesis and focus areas
   - Fund information and announcements
   - News and press coverage
   - Contact and office information

**TARGET FIRMS TO RESEARCH:**
Research a diverse mix of investment firms including:
- Top-tier venture capital firms (Sequoia, Andreessen Horowitz, Kleiner Perkins, etc.)
- Sector-focused VCs (healthcare, fintech, enterprise software, etc.)
- Regional investment firms and emerging managers
- Corporate venture arms (Google Ventures, Intel Capital, etc.)
- Angel investor groups and syndicates
- Private equity firms focused on growth and buyouts

**EXTRACTION GUIDELINES:**
- Extract ONLY factual information from reliable sources
- Cross-reference data across multiple sources for accuracy
- For missing data, use appropriate null values or empty arrays
- Rewrite all content in neutral, professional tone
- Include fund sizes in millions (numeric values only)
- Use current data from the last 2-3 years when possible

**OUTPUT REQUIREMENTS:**
Return ONLY valid JSON array containing multiple investor records. Each record must match our database schema exactly. No additional text, explanations, or questions.

**DETAILED FIELD INSTRUCTIONS:**

[
  {
    "firm_name": "Official firm name (e.g., 'Andreessen Horowitz', 'Sequoia Capital')",
    
    "address": "Street address of main office (if available)",
    
    "city": "Primary office city (e.g., 'San Francisco', 'New York')",
    
    "state": "State/Province (e.g., 'CA', 'NY')",
    
    "zip": "ZIP/Postal code",
    
    "website": "Primary website URL",
    
    "sector_focus": ["Array of 2-6 key investment sectors/verticals", "e.g. 'Enterprise Software', 'Digital Health', 'Fintech'"],
    
    "stage": "Primary investment stage (e.g., 'Series A', 'Growth Equity', 'Seed', 'Early Stage')",
    
    "check_size_min": 5, // Minimum investment size in millions (numeric only)
    
    "check_size_max": 50, // Maximum investment size in millions (numeric only)
    
    "latest_fund_name": "Name of most recent fund (e.g., 'Fund VIII', 'Growth Fund III')",
    
    "latest_fund_year": 2023, // Year of latest fund (numeric)
    
    "latest_fund_size": 2000, // Fund size in millions (numeric only)
    
    "total_aum": 15000, // Total assets under management in millions (numeric only)
    
    "lead_partner": "Name and title of key contact partner",
    
    "contact_email": "General contact email (info@, contact@, etc.)"
  }
]

**RESEARCH FOCUS AREAS:**
- Focus on active firms that have made investments in the last 2-3 years
- Include both large established funds and emerging/specialist managers
- Cover diverse geographic regions (SF Bay Area, NYC, LA, Boston, Austin, international)
- Mix of generalist and sector-specialist investors
- Include both traditional VCs and newer models (rolling funds, syndicates)

**DATA QUALITY REQUIREMENTS:**
- Firm names must be official/legal names
- Fund sizes should be from recent public announcements
- Sector focus should reflect actual portfolio investments
- Check sizes should reflect typical investment ranges
- Contact information should be current and accurate

Research 15-25 high-quality investor records and return them as a clean JSON array.`;

    setGeneratedPrompt(prompt);
    toast({
      title: "Research Prompt Generated",
      description: "Copy this prompt and use it with ChatGPT, Claude, or your preferred AI research tool.",
    });
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast({
        title: "Copied!",
        description: "Research prompt copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please select and copy the text manually",
        variant: "destructive",
      });
    }
  };

  const processInvestorJson = async () => {
    if (!importJson.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste the JSON data from your research",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingResult(null);

    try {
      console.log('Processing investor JSON data...');
      
      const { data, error } = await supabase.functions.invoke('process-investor-json', {
        body: { rawJson: importJson }
      });

      if (error) throw error;

      setProcessingResult(data);

      if (data.success && data.cleanedData) {
        // Insert the cleaned data into the investors table
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const investorsToInsert = Array.isArray(data.cleanedData) ? data.cleanedData : [data.cleanedData];
        
        // Add user_id to each investor record
        const investorsWithUserId = investorsToInsert.map(investor => ({
          ...investor,
          user_id: user.id
        }));

        const { error: insertError } = await supabase
          .from('investors')
          .insert(investorsWithUserId);

        if (insertError) throw insertError;

        toast({
          title: "Success!",
          description: `Added ${investorsWithUserId.length} investor(s) to the database`,
        });

        onInvestorsAdded?.(investorsWithUserId.length);
        onClose();
      } else {
        toast({
          title: "Processing Issues",
          description: `Processing completed with ${data.errors?.length || 0} errors and ${data.warnings?.length || 0} warnings`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing investor JSON:', error);
      toast({
        title: "Error",
        description: "Failed to process investor data. Please check the JSON format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setStep('prompt');
    setGeneratedPrompt('');
    setImportJson('');
    setProcessingResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Generate Investor Research
          </DialogTitle>
          <DialogDescription>
            Admin tool to research and import investor firm data using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Navigation */}
          <div className="flex space-x-1 rounded-lg bg-muted p-1">
            <Button
              variant={step === 'prompt' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStep('prompt')}
              className="flex-1"
            >
              1. Generate Prompt
            </Button>
            <Button
              variant={step === 'import' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStep('import')}
              className="flex-1"
            >
              2. Import Results
            </Button>
          </div>

          {step === 'prompt' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Generate a comprehensive research prompt to use with AI tools like ChatGPT or Claude for detailed investor research:
              </div>

              {!generatedPrompt ? (
                <Button onClick={generateInvestorPrompt} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Generate Investor Research Prompt
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Generated Research Prompt:</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPrompt}
                      className="h-8"
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      Copy
                    </Button>
                  </div>

                  <Textarea
                    value={generatedPrompt}
                    readOnly
                    className="h-96 font-mono text-sm"
                    placeholder="Generated prompt will appear here..."
                  />

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Next Steps:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Copy the prompt above</li>
                        <li>Use it with ChatGPT, Claude, or your preferred AI research tool</li>
                        <li>Get the JSON results from your research</li>
                        <li>Come back and import the results in step 2</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={() => setStep('import')} 
                    className="w-full"
                  >
                    Continue to Import Results
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'import' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Paste the JSON results from your AI research here. The system will clean and validate the data before importing:
              </div>

              <Textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste your JSON research results here..."
                className="h-64 font-mono text-sm"
              />

              <Button
                onClick={processInvestorJson}
                disabled={isProcessing || !importJson.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Investor Data...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process & Import Investor Data
                  </>
                )}
              </Button>

              {processingResult && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {processingResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      Processing Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        Model: {processingResult.modelUsed}
                      </Badge>
                      <Badge variant="outline">
                        Time: {processingResult.processingTimeMs}ms
                      </Badge>
                      {processingResult.warnings?.length > 0 && (
                        <Badge variant="secondary">
                          {processingResult.warnings.length} warnings
                        </Badge>
                      )}
                      {processingResult.errors?.length > 0 && (
                        <Badge variant="destructive">
                          {processingResult.errors.length} errors
                        </Badge>
                      )}
                    </div>

                    {processingResult.fixes?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">Fixes Applied:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {processingResult.fixes.map((fix: string, index: number) => (
                            <li key={index}>{fix}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {processingResult.warnings?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-yellow-600 mb-1">Warnings:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {processingResult.warnings.map((warning: string, index: number) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {processingResult.errors?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {processingResult.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};