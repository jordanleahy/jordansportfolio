import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { UsageOverview } from "@/components/admin/UsageOverview";

interface AdminUserRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  total_images: number;
  total_estimated_cost: number;
}

export default function AdminUsers() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-users');
      if (error) throw error;
      return data as { users: AdminUserRow[] };
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  return (
    <>
      <Helmet>
        <title>Users Admin - Usage Overview</title>
        <meta name="description" content="Admin view of all users with image counts and costs." />
        <link rel="canonical" href="/admin/users" />
      </Helmet>
      <main className="container mx-auto px-4 py-8">
...
      </main>
    </>
  );
}
