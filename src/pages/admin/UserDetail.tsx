import { PageLayout } from "@/components/layout/PageLayout";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";

interface UsageDetailResponse {
  user: { user_id: string; email: string | null; full_name: string | null; created_at: string } | null;
  auth?: { email_confirmed_at: string | null; last_sign_in_at: string | null } | null;
  range: { from: string; to: string };
  totals: { images: number; cost: number };
  periods?: {
    week: { images: number; cost: number };
    month: { images: number; cost: number };
    all: { images: number; cost: number };
  };
  daily: { date: string; images: number; cost: number }[];
  recent: any[];
}

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const validId = !!id && UUID_RE.test(id);
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
    enabled: validId,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const title = data?.user?.full_name ? `${data.user.full_name} - Usage` : 'User Usage';

  if (!validId) {
    return (
      <PageLayout>
        <Helmet>
          <title>User Usage</title>
          <meta name="description" content="Admin user usage detail with daily image and cost breakdown." />
          <link rel="canonical" href={`/admin/users`} />
        </Helmet>
        <main className="container mx-auto px-4 py-8">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User</h1>
              <p className="text-muted-foreground">Invalid or missing user id.</p>
            </div>
          </header>
          <Card>
            <CardContent>
              <p className="text-muted-foreground">Please go back to the Users list and select a user.</p>
              <div className="mt-4">
                <Link to="/admin/users" className="underline">Back to Users</Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content="Admin user usage detail with daily image and cost breakdown." />
        <link rel="canonical" href={`/admin/users/${id}`} />
      </Helmet>
      <main className="container mx-auto px-4 py-8">
        {/* Header with Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/users" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Menu className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{data?.user?.full_name || 'User'}</h1>
          </div>
        </div>

        <header className="mb-6 flex items-center justify-between">
          <div>
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

        {/* Image stats and account info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Image Generation Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>This Week</span>
                  <Badge variant="secondary">{data?.periods ? data.periods.week.images : (isLoading ? '…' : 0)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>This Month</span>
                  <Badge variant="secondary">{data?.periods ? data.periods.month.images : (isLoading ? '…' : 0)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>All Time</span>
                  <Badge>{data?.periods ? data.periods.all.images : (isLoading ? '…' : 0)}</Badge>
                </div>
                <hr className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estimated Total Cost</span>
                  <Badge variant="outline">${data?.periods ? data.periods.all.cost.toFixed(2) : (isLoading ? '…' : '0.00')}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Full Name</span>
                  <span className="text-muted-foreground">{data?.user?.full_name || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <span className="text-muted-foreground break-all">{data?.user?.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Member Since</span>
                  <span className="text-muted-foreground">
                    {data?.user?.created_at ? new Date(data.user.created_at).toLocaleDateString() : (isLoading ? '…' : '—')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>User ID</span>
                  <span className="text-muted-foreground">{data?.user?.user_id || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email Verified</span>
                  {data?.auth?.email_confirmed_at ? (
                    <Badge>Verified</Badge>
                  ) : (
                    <Badge variant="secondary">Unverified</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Sign In</span>
                  <span className="text-muted-foreground">
                    {data?.auth?.last_sign_in_at ? new Date(data.auth.last_sign_in_at).toLocaleString() : (isLoading ? '…' : '—')}
                  </span>
                </div>
              </div>
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
                  {!isLoading && (!data || data.recent.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">No recent items.</TableCell>
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
