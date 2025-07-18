import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  companyName: string;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  prompt,
  companyName
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(prompt);
        toast({
          title: "Copied to clipboard",
          description: "Prompt has been copied to your clipboard",
        });
      } else {
        // Fallback for older browsers or non-secure contexts
        if (textareaRef.current) {
          textareaRef.current.select();
          textareaRef.current.setSelectionRange(0, 99999); // For mobile devices
          
          try {
            document.execCommand('copy');
            toast({
              title: "Copied to clipboard",
              description: "Prompt has been copied to your clipboard",
            });
          } catch (err) {
            toast({
              title: "Copy failed",
              description: "Please manually select and copy the text (Ctrl/Cmd+C)",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Please manually select and copy the text (Ctrl/Cmd+C)",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAsText = () => {
    try {
      const blob = new Blob([prompt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_research_prompt.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Prompt has been downloaded as a text file",
      });
    } catch (error) {
      console.error('Failed to download prompt:', error);
      toast({
        title: "Download failed",
        description: "Unable to download the prompt file",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">
            Research Prompt for {companyName}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy this prompt and paste it into ChatGPT, Claude, or your preferred AI assistant for comprehensive company research.
          </p>
          
          <div className="flex-1 min-h-0">
            <Textarea
              ref={textareaRef}
              value={prompt}
              readOnly
              className="h-full min-h-[400px] font-mono text-sm resize-none"
              placeholder="Prompt will appear here..."
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2"
              size="sm"
            >
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
            
            <Button
              onClick={handleDownloadAsText}
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Download as .txt
            </Button>
            
            <div className="flex-1" />
            
            <Button
              onClick={onClose}
              variant="secondary"
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};