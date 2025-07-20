
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText } from 'lucide-react';

interface ParsedCitation {
  id: string;
  documentId: string;
  startLine?: number;
  endLine?: number;
  originalText: string;
}

interface CitationIndicatorProps {
  citations: ParsedCitation[];
  className?: string;
}

export const CitationIndicator = ({ citations, className = "" }: CitationIndicatorProps) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  const uniqueDocuments = [...new Set(citations.map(c => c.documentId))];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`ml-2 text-xs cursor-help ${className}`}>
            <FileText className="h-3 w-3 mr-1" />
            {citations.length} ref{citations.length !== 1 ? 's' : ''}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="space-y-2">
            <p className="font-medium text-xs">
              {citations.length} citation{citations.length !== 1 ? 's' : ''} from {uniqueDocuments.length} source{uniqueDocuments.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1">
              {uniqueDocuments.slice(0, 3).map((docId, index) => {
                const docCitations = citations.filter(c => c.documentId === docId);
                return (
                  <div key={docId} className="text-xs text-muted-foreground">
                    <span className="font-mono">{docId.substring(0, 12)}...</span>
                    {docCitations.some(c => c.startLine) && (
                      <span className="ml-1">
                        (L{docCitations.map(c => 
                          c.endLine && c.endLine !== c.startLine 
                            ? `${c.startLine}-${c.endLine}` 
                            : c.startLine
                        ).filter(Boolean).join(', ')})
                      </span>
                    )}
                  </div>
                );
              })}
              {uniqueDocuments.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{uniqueDocuments.length - 3} more sources
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
