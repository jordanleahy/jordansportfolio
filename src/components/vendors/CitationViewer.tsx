
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface ParsedCitation {
  id: string;
  documentId: string;
  startLine?: number;
  endLine?: number;
  originalText: string;
}

interface CitationViewerProps {
  citations: { [key: string]: ParsedCitation[] };
  citationCount: number;
}

export const CitationViewer = ({ citations, citationCount }: CitationViewerProps) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!citations || citationCount === 0) {
    return null;
  }

  const allCitations = Object.values(citations).flat();
  const uniqueDocuments = [...new Set(allCitations.map(c => c.documentId))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Source Citations</span>
            <Badge variant="secondary" className="text-xs">
              {citationCount} references
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-2"
          >
            {expanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {expanded ? 'Hide' : 'Show'} Details
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Total Citations</p>
            <p className="text-2xl font-bold text-primary">{citationCount}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Unique Sources</p>
            <p className="text-2xl font-bold text-primary">{uniqueDocuments.length}</p>
          </div>
        </div>

        {/* Cited Fields */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Fields with Citations</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(citations).map(([field, fieldCitations]) => (
              <Badge key={field} variant="outline" className="text-xs">
                {field.replace(/_/g, ' ')} ({fieldCitations.length})
              </Badge>
            ))}
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Source Documents</p>
              <div className="space-y-2">
                {uniqueDocuments.map((docId, index) => {
                  const docCitations = allCitations.filter(c => c.documentId === docId);
                  return (
                    <div key={docId} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">Document {index + 1}</p>
                        <Badge variant="secondary" className="text-xs">
                          {docCitations.length} refs
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        ID: {docId}
                      </p>
                      {docCitations.some(c => c.startLine) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Lines: {docCitations.map(c => 
                            c.endLine && c.endLine !== c.startLine 
                              ? `${c.startLine}-${c.endLine}` 
                              : c.startLine
                          ).filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Citation Details by Field */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Citations by Field</p>
              <div className="space-y-3">
                {Object.entries(citations).map(([field, fieldCitations]) => (
                  <div key={field} className="border rounded-lg p-3">
                    <p className="font-medium text-sm capitalize mb-2">
                      {field.replace(/_/g, ' ')}
                    </p>
                    <div className="space-y-1">
                      {fieldCitations.map((citation, index) => (
                        <div key={citation.id} className="text-xs text-muted-foreground font-mono">
                          {index + 1}. {citation.documentId}
                          {citation.startLine && (
                            <span className="ml-2">
                              (Lines {citation.startLine}
                              {citation.endLine && citation.endLine !== citation.startLine && `-${citation.endLine}`})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
