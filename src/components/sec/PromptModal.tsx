import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, X } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    setIsLoading(true);
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(prompt);
        setIsCopied(true);
        toast({
          title: "Copied successfully!",
          description: "Research prompt is ready to use in your AI assistant",
        });
      } else {
        // Fallback for older browsers or non-secure contexts
        if (textareaRef.current) {
          textareaRef.current.select();
          textareaRef.current.setSelectionRange(0, 99999);
          
          try {
            document.execCommand('copy');
            setIsCopied(true);
            toast({
              title: "Copied successfully!",
              description: "Research prompt is ready to use in your AI assistant",
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
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-gradient-to-br from-background to-muted/20">
        <DialogHeader className="space-y-6 pb-6">
          <div className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight">
                Research Prompt
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-medium">
                {companyName}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 shrink-0 hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Copy this AI-powered research prompt and paste it into ChatGPT, Claude, or your preferred AI assistant for comprehensive company analysis.
            </p>
            
            <Button
              onClick={handleCopyToClipboard}
              disabled={isLoading}
              className="w-full sm:w-auto h-12 px-8 text-base font-semibold transition-all duration-200 hover:scale-105"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Copying...
                </>
              ) : isCopied ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mr-2" />
                  Copy Research Prompt
                </>
              )}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 space-y-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border p-4 h-full">
            <Textarea
              ref={textareaRef}
              value={prompt}
              readOnly
              className="h-full min-h-[400px] font-mono text-sm resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Prompt will appear here..."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};