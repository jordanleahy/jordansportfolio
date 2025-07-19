
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Lightbulb } from "lucide-react";

interface VendorQAResultsProps {
  qaResult: {
    qualityScore: number;
    feedback: string[];
    suggestions: string[];
    warnings: string[];
    isRecommended: boolean;
  };
  onProceed: () => void;
  onReject: () => void;
  onBypass: () => void;
  isProcessing: boolean;
}

export const VendorQAResults = ({ 
  qaResult, 
  onProceed, 
  onReject, 
  onBypass, 
  isProcessing 
}: VendorQAResultsProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Quality Score */}
      <Card className={`border-2 ${getScoreColor(qaResult.qualityScore)}`}>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
            <div className="flex items-center gap-2">
              {getScoreIcon(qaResult.qualityScore)}
              <span>Data Quality Assessment</span>
            </div>
            <Badge variant="outline" className="self-start sm:ml-auto text-sm sm:text-base px-2 sm:px-3 py-1">
              {qaResult.qualityScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  qaResult.qualityScore >= 80 ? 'bg-green-500' :
                  qaResult.qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${qaResult.qualityScore}%` }}
              />
            </div>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed">
            {qaResult.isRecommended 
              ? "✅ This data meets quality standards and is recommended for addition."
              : "⚠️ This data has quality issues that should be addressed before adding."
            }
          </p>
        </CardContent>
      </Card>

      {/* Feedback */}
      {qaResult.feedback.length > 0 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span>Analysis Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {qaResult.feedback.map((item, index) => (
                <li key={index} className="text-xs sm:text-sm flex items-start gap-2">
                  <span className="text-blue-600 mt-1 flex-shrink-0">•</span>
                  <span className="leading-relaxed break-words">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {qaResult.warnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-orange-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Warnings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {qaResult.warnings.map((item, index) => (
                <li key={index} className="text-xs sm:text-sm text-orange-700 flex items-start gap-2">
                  <span className="text-orange-600 mt-1 flex-shrink-0">⚠</span>
                  <span className="leading-relaxed break-words">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {qaResult.suggestions.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-purple-800">
              <Lightbulb className="h-4 w-4 flex-shrink-0" />
              <span>Improvement Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {qaResult.suggestions.map((item, index) => (
                <li key={index} className="text-xs sm:text-sm text-purple-700 flex items-start gap-2">
                  <span className="text-purple-600 mt-1 flex-shrink-0">💡</span>
                  <span className="leading-relaxed break-words">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
        {qaResult.isRecommended ? (
          <Button 
            onClick={onProceed} 
            disabled={isProcessing}
            className="w-full sm:flex-1 text-sm"
          >
            {isProcessing ? "Processing..." : "Proceed with Addition"}
          </Button>
        ) : (
          <Button 
            onClick={onProceed} 
            disabled={isProcessing}
            variant="outline"
            className="w-full sm:flex-1 text-sm"
          >
            {isProcessing ? "Processing..." : "Add Despite Issues"}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={onBypass}
          disabled={isProcessing}
          className="w-full sm:w-auto text-sm"
        >
          <span className="hidden sm:inline">Skip QA & </span>Preview
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={onReject}
          disabled={isProcessing}
          className="w-full sm:w-auto text-sm"
        >
          <span className="hidden sm:inline">Reject & </span>Edit
        </Button>
      </div>
    </div>
  );
};
