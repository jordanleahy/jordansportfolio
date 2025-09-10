import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSecureAuth = (contentType: 'case_study' | 'cofactor') => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();

  const checkAccess = useCallback(async () => {
    try {
      const { data: hasAccess, error } = await supabase.rpc('has_content_access', {
        content_type_param: contentType
      });

      if (error) throw error;
      setHasAccess(hasAccess);
      return hasAccess;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }, [contentType]);

  const requestAccess = useCallback(async (password: string) => {
    setIsLoading(true);
    try {
      const { data: accessGranted, error } = await supabase.rpc('validate_content_password' as any, {
        content_type_param: contentType,
        password_param: password
      });

      if (error) throw error;

      if (accessGranted) {
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