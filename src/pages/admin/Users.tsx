import { PageLayout } from "@/components/layout/PageLayout";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

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
    }
  });

  return (
    <PageLayout>
      <Helmet>
        <title>Users Admin - Usage Overview</title>
        <meta name="description" content="Admin view of all users with image counts and costs." />
        <link rel="canonical" href="/admin/users" />
      </Helmet>
      <main className="container mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">All users with usage and cost overview.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>User Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Total Images</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5}>Loading...</TableCell>
                    </TableRow>
                  )}
                  {error && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-destructive">Failed to load</TableCell>
                    </TableRow>
                  )}
                  {data?.users?.map((u) => (
                    <TableRow key={u.user_id} className="cursor-pointer" onClick={() => navigate(`/admin/users/${u.user_id}`)}>
                      <TableCell>
                        <div className="font-medium">{u.full_name || '—'}</div>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate">{u.email || '—'}</TableCell>
                      <TableCell>{format(new Date(u.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{u.total_images.toLocaleString()}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${u.total_estimated_cost.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageLayout>
  );
}
