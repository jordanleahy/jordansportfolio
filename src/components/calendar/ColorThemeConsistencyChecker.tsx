import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Palette, BarChart3 } from 'lucide-react';
import { useColorThemes } from '@/hooks/useColorThemes';
import { colorValidationService } from '@/services/colorValidationService';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ColorTheme } from '@/types/colorTheme';

interface ColorConsistencyReport {
  totalPosts: number;
  postsWithThemes: number;
  postsWithoutThemes: number;
  consistencyScore: number;
  themeDistribution: Record<string, number>;
  recommendations: string[];
  colorIssues: Array<{
    themeId: string;
    themeName: string;
    issues: string[];
  }>;
}

interface ColorThemeConsistencyCheckerProps {
  category: string;
}

export const ColorThemeConsistencyChecker: React.FC<ColorThemeConsistencyCheckerProps> = ({ category }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ColorConsistencyReport | null>(null);
  const { data: colorThemes = [] } = useColorThemes();

  const { data: categoryPosts = [] } = useQuery({
    queryKey: ['category-posts', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('id, title, color_theme_id, status')
        .eq('category', category);
      
      if (error) throw error;
      return data;
    }
  });

  const analyzeColorConsistency = async () => {
    setIsAnalyzing(true);
    
    try {
      const totalPosts = categoryPosts.length;
      const postsWithThemes = categoryPosts.filter(post => post.color_theme_id).length;
      const postsWithoutThemes = totalPosts - postsWithThemes;
      
      // Calculate theme distribution
      const themeDistribution: Record<string, number> = {};
      categoryPosts.forEach(post => {
        if (post.color_theme_id) {
          const theme = colorThemes.find(t => t.id === post.color_theme_id);
          const themeName = theme?.name || 'Unknown Theme';
          themeDistribution[themeName] = (themeDistribution[themeName] || 0) + 1;
        }
      });

      // Analyze color themes for accessibility and consistency
      const colorIssues: Array<{ themeId: string; themeName: string; issues: string[] }> = [];
      
      for (const theme of colorThemes) {
        const issues: string[] = [];
        
        // Validate each color in the theme
        const colors = {
          primary: theme.primary_color,
          secondary: theme.secondary_color,
          accent: theme.accent_color,
          background: theme.background_color,
          text: theme.text_color,
          border: theme.border_color,
        };

        for (const [colorType, colorValue] of Object.entries(colors)) {
          if (colorValue) {
            const validation = colorValidationService.validateColor(colorValue, {
              property: colorType,
              backgroundColor: theme.background_color
            });

            if (!validation.isValid || validation.errors.length > 0) {
              issues.push(`${colorType}: ${validation.errors.join(', ')}`);
            }

            if (validation.warnings.length > 0) {
              issues.push(`${colorType}: ${validation.warnings.join(', ')}`);
            }
          }
        }

        // Check contrast between text and background
        if (theme.text_color && theme.background_color) {
          const accessibility = colorValidationService.validateColor(theme.text_color, {
            backgroundColor: theme.background_color
          }).accessibility;

          if (accessibility && accessibility.wcagLevel === 'fail') {
            issues.push(`Poor contrast ratio (${accessibility.contrastRatio?.toFixed(2)}) between text and background`);
          }
        }

        if (issues.length > 0) {
          colorIssues.push({
            themeId: theme.id,
            themeName: theme.name,
            issues
          });
        }
      }

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (postsWithoutThemes > 0) {
        recommendations.push(`${postsWithoutThemes} posts need color theme assignment`);
      }

      const dominantTheme = Object.entries(themeDistribution).sort((a, b) => b[1] - a[1])[0];
      if (dominantTheme && dominantTheme[1] < totalPosts * 0.7) {
        recommendations.push('Consider standardizing on one primary theme for better consistency');
      }

      if (colorIssues.length > 0) {
        recommendations.push(`${colorIssues.length} themes have accessibility or validation issues that need attention`);
      }

      // Look for category-specific recommendations
      if (category === 'product-management') {
        const hasProductTheme = colorThemes.some(theme => 
          theme.name.toLowerCase().includes('product') || 
          theme.name.toLowerCase().includes('corporate') ||
          theme.name.toLowerCase().includes('professional')
        );
        
        if (!hasProductTheme) {
          recommendations.push('Consider creating a dedicated "Product Management" theme with professional blues/grays');
        }
      }

      const consistencyScore = Math.round(
        ((postsWithThemes / totalPosts) * 70) + 
        ((colorIssues.length === 0 ? 1 : 0) * 30)
      );

      const newReport: ColorConsistencyReport = {
        totalPosts,
        postsWithThemes,
        postsWithoutThemes,
        consistencyScore,
        themeDistribution,
        recommendations,
        colorIssues
      };

      setReport(newReport);
    } catch (error) {
      console.error('Error analyzing color consistency:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Color Theme Consistency for {category}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={analyzeColorConsistency}
          disabled={isAnalyzing || categoryPosts.length === 0}
          className="w-full"
        >
          {isAnalyzing ? (
            <>Analyzing Color Consistency...</>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze Color Theme Consistency
            </>
          )}
        </Button>

        {categoryPosts.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No posts found for the {category} category. Create some posts first to analyze color consistency.
            </AlertDescription>
          </Alert>
        )}

        {report && (
          <div className="space-y-4">
            {/* Consistency Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getScoreIcon(report.consistencyScore)}
                  Consistency Score: {report.consistencyScore}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={report.consistencyScore} className="w-full" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>Poor</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </CardContent>
            </Card>

            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{report.totalPosts}</div>
                  <div className="text-sm text-muted-foreground">Total Posts</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{report.postsWithThemes}</div>
                  <div className="text-sm text-muted-foreground">With Themes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{report.postsWithoutThemes}</div>
                  <div className="text-sm text-muted-foreground">Missing Themes</div>
                </CardContent>
              </Card>
            </div>

            {/* Theme Distribution */}
            {Object.keys(report.themeDistribution).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Theme Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(report.themeDistribution).map(([themeName, count]) => (
                      <div key={themeName} className="flex items-center justify-between">
                        <span className="text-sm">{themeName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{count} posts</Badge>
                          <div className="w-16 text-xs text-right">
                            {Math.round((count / report.totalPosts) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Color Issues */}
            {report.colorIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    Color Theme Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.colorIssues.map((issue) => (
                      <Alert key={issue.themeId} variant="destructive">
                        <AlertDescription>
                          <div className="font-medium">{issue.themeName}</div>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {issue.issues.map((item, index) => (
                              <li key={index} className="text-sm">{item}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};