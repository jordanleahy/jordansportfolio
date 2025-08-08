import { PageLayout } from "@/components/layout/PageLayout";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface UsageDetailResponse {
  user: { user_id: string; email: string | null; full_name: string | null; created_at: string } | null;
  range: { from: string; to: string };
  totals: { images: number; cost: number };
  daily: { date: string; images: number; cost: number }[];
  recent: any[];
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [range, setRange] = useState<'7' | '30' | '90'>('30');

  const { from, to } = useMemo(() => {
    const to = new Date();
    const days = Number(range);
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [range]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-user-detail', id, range],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('user-usage-detail', {
        body: { userId: id, dateFrom: from, dateTo: to }
      });
      if (error) throw error;
      return data as UsageDetailResponse;
    },
    enabled: !!id
  });

  const title = data?.user?.full_name ? `${data.user.full_name} - Usage` : 'User Usage';

  return (
    <PageLayout>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content="Admin user usage detail with daily image and cost breakdown." />
        <link rel="canonical" href={`/admin/users/${id}`} />
      </Helmet>
      <main className="container mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data?.user?.full_name || 'User'} </h1>
            <p className="text-muted-foreground">{data?.user?.email}</p>
          </div>
          <div className="w-40">
            <Select value={range} onValueChange={(v: any) => setRange(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.totals.images ?? (isLoading ? '…' : 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${data ? data.totals.cost.toFixed(2) : (isLoading ? '…' : '0.00')}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daily Images</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.daily || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="images" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5}>Loading…</TableCell>
                    </TableRow>
                  )}
                  {data?.recent?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell>{r.model_used || '—'}</TableCell>
                      <TableCell>{r.request_type || r.function_name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={r.success ? 'default' : 'destructive'}>
                          {r.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${Number(r.estimated_cost || 0).toFixed(4)}</TableCell>
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
