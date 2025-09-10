import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Client-side password configuration
const PASSWORDS = {
  case_study: 'PawPatrolRocks',
  cofactor: 'QueryInnovation2024' // You can change this password as needed
};

export const useSecureAuth = (contentType: 'case_study' | 'cofactor') => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();

  const getAccessKey = (type: string) => `content_access_${type}`;

  const checkAccess = useCallback(() => {
    const accessKey = getAccessKey(contentType);
    const hasStoredAccess = localStorage.getItem(accessKey) === 'granted';
    setHasAccess(hasStoredAccess);
    return hasStoredAccess;
  }, [contentType]);

  // Check access on mount and when contentType changes
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const requestAccess = useCallback(async (password: string) => {
    setIsLoading(true);
    
    // Simulate async operation for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const correctPassword = PASSWORDS[contentType];
      
      if (password === correctPassword) {
        // Grant access and store in localStorage
        const accessKey = getAccessKey(contentType);
        localStorage.setItem(accessKey, 'granted');
        setHasAccess(true);
        
        toast({
          title: "Access Granted",
          description: `Welcome to the ${contentType === 'case_study' ? 'case studies portfolio' : 'Query Innovation proposal'}.`
        });
        return true;
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect password. Please try again.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error requesting access:', error);
      toast({
        title: "Error",
        description: "An error occurred while verifying access. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contentType, toast]);

  return {
    hasAccess,
    isLoading,
    checkAccess,
    requestAccess
  };
};