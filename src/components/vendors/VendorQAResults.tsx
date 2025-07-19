
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
    <div className="space-y-4">
      {/* Quality Score */}
      <Card className={`border-2 ${getScoreColor(qaResult.qualityScore)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getScoreIcon(qaResult.qualityScore)}
            <span>Data Quality Assessment</span>
            <Badge variant="outline" className="ml-auto text-base px-3 py-1">
              {qaResult.qualityScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
          <p className="text-sm">
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
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Analysis Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {qaResult.feedback.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {qaResult.warnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {qaResult.warnings.map((item, index) => (
                <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                  <span className="text-orange-600 mt-1">⚠</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {qaResult.suggestions.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-purple-800">
              <Lightbulb className="h-4 w-4" />
              Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {qaResult.suggestions.map((item, index) => (
                <li key={index} className="text-sm text-purple-700 flex items-start gap-2">
                  <span className="text-purple-600 mt-1">💡</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {qaResult.isRecommended ? (
          <Button 
            onClick={onProceed} 
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? "Processing..." : "Proceed with Addition"}
          </Button>
        ) : (
          <Button 
            onClick={onProceed} 
            disabled={isProcessing}
            variant="outline"
            className="flex-1"
          >
            {isProcessing ? "Processing..." : "Add Despite Issues"}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={onBypass}
          disabled={isProcessing}
        >
          Skip QA & Preview
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={onReject}
          disabled={isProcessing}
        >
          Reject & Edit
        </Button>
      </div>
    </div>
  );
};
