import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Users, 
  Calendar,
  ExternalLink,
  Loader2,
  FileText
} from 'lucide-react';
import { useVendorAnalysis, VendorAnalysisData } from '@/hooks/useVendorAnalysis';
import { useToast } from '@/hooks/use-toast';

export const VendorAnalysisInterface = () => {
  const [companyName, setCompanyName] = useState('');
  const { toast } = useToast();
  
  const {
    analysisResult,
    analyzeVendor,
    isAnalyzing,
    analysisError,
    generateTheme,
    isGeneratingTheme,
    themeResult,
    analyzeAndGenerateTheme,
    clearAnalysis
  } = useVendorAnalysis();

  const handleAnalyze = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Company Name Required",
        description: "Please enter a company name to analyze",
        variant: "destructive",
      });
      return;
    }
    
    analyzeVendor(companyName.trim());
  };

  const handleAnalyzeAndCreateTheme = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Company Name Required",
        description: "Please enter a company name to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      await analyzeAndGenerateTheme(companyName.trim());
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getDataSourceIcon = (source: string) => {
    switch (source) {
      case 'internal_database': return <Building2 className="h-4 w-4" />;
      case 'web_research': return <Search className="h-4 w-4" />;
      case 'hybrid': return <Target className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Vendor Analysis Agent
          </CardTitle>
          <CardDescription>
            Analyze companies for competitive intelligence by combining internal database data with web research.
            Get structured insights for competitive strategy and market positioning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter company name (e.g., SmarterDX, Palantir)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="flex-1"
            />
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || isGeneratingTheme}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={handleAnalyzeAndCreateTheme}
              disabled={isAnalyzing || isGeneratingTheme}
            >
              {isGeneratingTheme ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Analyze & Create Theme
                </>
              )}
            </Button>
          </div>
          
          {analysisError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                {analysisError.message || 'Failed to analyze vendor'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {analysisResult.company.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getConfidenceBadgeVariant(analysisResult.analysis_confidence)}>
                      {analysisResult.analysis_confidence} confidence
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getDataSourceIcon(analysisResult.data_source)}
                      {analysisResult.data_source.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated: {new Date(analysisResult.last_updated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {analysisResult && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateTheme()}
                      disabled={isGeneratingTheme}
                    >
                      {isGeneratingTheme ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      Generate Theme
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={clearAnalysis}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {analysisResult.company.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {analysisResult.company.founded && (
                  <div>
                    <span className="font-medium">Founded:</span> {analysisResult.company.founded}
                  </div>
                )}
                {analysisResult.company.headquarters && (
                  <div>
                    <span className="font-medium">Headquarters:</span> {analysisResult.company.headquarters}
                  </div>
                )}
                {analysisResult.company.website && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Website:</span> 
                    <a 
                      href={analysisResult.company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Tabs defaultValue="intelligence" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
              <TabsTrigger value="business">Business Model</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="updates">Recent Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="intelligence" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {analysisResult.competitive_intelligence.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">+</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Weaknesses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {analysisResult.competitive_intelligence.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500 font-bold">-</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {analysisResult.competitive_intelligence.opportunities.map((opportunity, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold">○</span>
                          {opportunity}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Threats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {analysisResult.competitive_intelligence.threats.map((threat, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">!</span>
                          {threat}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Market Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{analysisResult.competitive_intelligence.market_position}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Business Focus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysisResult.business_model.primary_focus}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Target Market</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysisResult.business_model.target_market}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Revenue Model</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysisResult.business_model.revenue_model}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Differentiators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.business_model.key_differentiators.map((diff, index) => (
                        <Badge key={index} variant="secondary">{diff}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {analysisResult.products_services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Products & Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.products_services.map((product, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-3">
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          <p className="text-xs text-muted-foreground">{product.description}</p>
                          <p className="text-xs text-muted-foreground">Target: {product.target_audience}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="financials" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysisResult.financials).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-base capitalize">
                          {key.replace('_', ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium">{value}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {analysisResult.leadership.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Leadership Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.leadership.map((leader, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-3">
                          <h4 className="font-medium text-sm">{leader.name}</h4>
                          <p className="text-xs text-muted-foreground">{leader.title}</p>
                          <p className="text-xs text-muted-foreground">{leader.background}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="updates" className="space-y-4">
              {analysisResult.recent_developments.length > 0 ? (
                <div className="space-y-3">
                  {analysisResult.recent_developments.map((development, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(development.date).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm">{development.event}</h4>
                            <p className="text-xs text-muted-foreground">{development.impact}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">No recent developments available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Theme Generation Result */}
      {themeResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generated Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-sm">Theme:</span> {themeResult.theme}
              </div>
              <div>
                <span className="font-medium text-sm">Category:</span> {themeResult.category}
              </div>
              <div>
                <span className="font-medium text-sm">Description:</span>
                <p className="text-sm text-muted-foreground mt-1">{themeResult.theme_description}</p>
              </div>
              <Separator />
              <div>
                <span className="font-medium text-sm">Posts Generated:</span> {themeResult.posts.length}
                <div className="mt-2 space-y-2">
                  {themeResult.posts.map((post, index) => (
                    <div key={index} className="border-l-2 border-primary/20 pl-3 py-1">
                      <h5 className="text-xs font-medium">Day {post.day}: {post.title}</h5>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.story_description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};