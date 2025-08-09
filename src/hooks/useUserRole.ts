import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'moderator' | 'user';

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setRole('user');
        } else {
          const roles = (data || []).map(r => r.role as UserRole);
          const effectiveRole: UserRole =
            roles.includes('admin') ? 'admin' :
            roles.includes('moderator') ? 'moderator' : 'user';
          setRole(effectiveRole);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator' || role === 'admin';

  return { role, isAdmin, isModerator, loading };
};