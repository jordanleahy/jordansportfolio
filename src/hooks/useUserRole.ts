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

        // Try robust role detection via RPC (bypasses RLS)
        try {
          const [adminRes, modRes] = await Promise.all([
            supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
            supabase.rpc('has_role', { _user_id: user.id, _role: 'moderator' })
          ]);

          const isAdminRole = adminRes.data === true;
          const isModeratorRole = modRes.data === true;

          const effectiveRole: UserRole = isAdminRole
            ? 'admin'
            : isModeratorRole
              ? 'moderator'
              : 'user';

          setRole(effectiveRole);
        } catch (rpcErr) {
          console.error('RPC has_role failed, falling back to table select:', rpcErr);
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