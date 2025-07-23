
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVendors } from '@/hooks/useVendors';
import type { User } from '@supabase/supabase-js';

export const useVendorPageProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const { toast } = useToast();

  // Fetch vendors from database
  const {
    data: allVendors = [],
    isLoading: isLoadingVendors,
    error: vendorsError,
    refetch: refetchVendors
  } = useVendors();

  // Enhanced authentication handling
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('Auth check result:', { user: user?.id, error });
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleVendorAdded = () => {
    refetchVendors();
    toast({
      title: "Success",
      description: "Vendor added successfully!",
    });
  };

  const handleVendorSaved = () => {
    refetchVendors();
    toast({
      title: "Success", 
      description: "Vendor updated successfully!",
    });
  };

  return {
    user,
    isLoadingAuth,
    allVendors,
    isLoadingVendors,
    vendorsError: vendorsError?.message || null,
    refetchVendors,
    handleVendorAdded,
    handleVendorSaved,
    toast
  };
};
