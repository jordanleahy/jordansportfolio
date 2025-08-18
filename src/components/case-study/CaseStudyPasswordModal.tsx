import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
interface CaseStudyPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
}
export const CaseStudyPasswordModal: React.FC<CaseStudyPasswordModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple client-side password check
    if (password === 'PawPatrolRocks') {
      // Store authentication in session storage
      sessionStorage.setItem('caseStudyAuth', 'true');
      onAuthenticate();
      onClose();
      setPassword('');
      toast({
        title: "Access Granted",
        description: "Welcome to the case studies portfolio."
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Protected Case Studies</DialogTitle>
          
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} className="pr-10" autoFocus />
            <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!password || isLoading} className="flex-1">
              {isLoading ? "Verifying..." : "Access Portfolio"}
            </Button>
          </div>
        </form>
        
        <div className="text-xs text-muted-foreground text-center mt-4">
          Access will be remembered for this browser session
        </div>
      </DialogContent>
    </Dialog>;
};