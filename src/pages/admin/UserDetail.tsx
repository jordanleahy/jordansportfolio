import { PageLayout } from "@/components/layout/PageLayout";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import { toast } from "sonner";
import { useSubscriptionTiers } from "@/hooks/useSubscriptionStatus";
import { useApiUsageData } from "@/hooks/useApiUsageQueries";
import { ApiUsageTable } from "@/components/admin/ApiUsageTable";
import { UsageDetailModal } from "@/components/admin/UsageDetailModal";
import type { ApiUsageRecord } from "@/types/apiUsage";

interface UsageDetailResponse {
  user: { user_id: string; email: string | null; full_name: string | null; created_at: string } | null;
  auth?: { email_confirmed_at: string | null; last_sign_in_at: string | null } | null;
  subscription?: {
    id: string;
    status: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    tier?: {
      id: string;
      name: string;
      price_cents: number | null;
      billing_interval: string | null;
      max_gpt_images: number | null;
    } | null;
  } | null;
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
  const [selectedTierName, setSelectedTierName] = useState<string>("");
  const { data: tiers = [] } = useSubscriptionTiers();
  const [saving, setSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ApiUsageRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { from, to } = useMemo(() => {
    const to = new Date();
    const days = Number(range);
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [range]);

  const { data, isLoading, error, refetch } = useQuery({
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

  // Update selected tier when subscription data loads
  useEffect(() => {
    if (data?.subscription?.tier?.name) {
      console.log('[AdminUserDetail] Setting dropdown to current subscription tier:', data.subscription.tier.name);
      setSelectedTierName(data.subscription.tier.name);
    } else {
      console.log('[AdminUserDetail] No subscription tier found, clearing dropdown');
      setSelectedTierName("");
    }
  }, [data?.subscription?.tier?.name]);

  // API Usage Data Hook - for detailed API call tracking
  const {
    data: apiUsageData,
    isLoading: apiUsageLoading,
    error: apiUsageError
  } = useApiUsageData({
    userId: validId ? id : undefined,
    startDate: from.split('T')[0], // Convert ISO to YYYY-MM-DD format
    endDate: to.split('T')[0]
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
            {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
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

        {/* Admin: Assign Subscription Tier */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Admin: Assign Subscription Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
              <div className="flex-1">
                <label className="block text-sm mb-1">Tier</label>
                <Select 
                  value={selectedTierName} 
                  onValueChange={(v) => {
                    console.log('[AdminUserDetail] Dropdown value changed:', v);
                    setSelectedTierName(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select a tier"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers?.map((t: any) => (
                      <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={async () => {
                  try {
                    if (!id) return;
                    const tierNameToUse = selectedTierName || data?.subscription?.tier?.name;
                    console.log('[AdminUserDetail] Assigning tier:', { 
                      selectedTierName, 
                      currentTier: data?.subscription?.tier?.name,
                      finalTier: tierNameToUse 
                    });
                    if (!tierNameToUse) {
                      toast.error('Please select a tier');
                      return;
                    }
                    const { data: resp, error } = await supabase.functions.invoke('admin-set-subscription', {
                      body: { userId: id, tierName: tierNameToUse }
                    });
                    if (error) throw error;
                    console.log('[AdminUserDetail] Tier assignment successful:', resp);
                    toast.success('Subscription assigned');
                    refetch();
                  } catch (err: any) {
                    console.error('[AdminUserDetail] Tier assignment failed:', err);
                    toast.error(err?.message || 'Failed to assign subscription');
                  }
                }}
              >
                Assign Tier
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    if (!id) return;
                    setSaving(true);
                    const { data: resp, error } = await supabase.functions.invoke('aggregate-monthly-usage', {
                      body: { userId: id }
                    });
                    if (error) throw error;
                    toast.success('Aggregates refreshed');
                    refetch();
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err?.message || 'Failed to refresh aggregates');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? 'Refreshing...' : 'Refresh Aggregates'}
              </Button>
            </div>
          </CardContent>
        </Card>

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

        {/* Subscription */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Plan</span>
                <span className="text-muted-foreground">{data?.subscription?.tier?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <Badge variant={data?.subscription?.status === 'active' ? 'default' : 'secondary'}>
                  {data?.subscription?.status || '—'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Current Period</span>
                <span className="text-muted-foreground">
                  {data?.subscription?.current_period_start
                    ? `${new Date(data.subscription.current_period_start).toLocaleDateString()} — ${data?.subscription?.current_period_end ? new Date(data.subscription.current_period_end).toLocaleDateString() : '—'}`
                    : (isLoading ? '…' : '—')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Price</span>
                <span className="text-muted-foreground">
                  {data?.subscription?.tier?.price_cents != null
                    ? `$${((data.subscription.tier.price_cents || 0) / 100).toFixed(2)}/${data.subscription.tier.billing_interval || 'month'}`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Images Limit</span>
                <span className="text-muted-foreground">{data?.subscription?.tier?.max_gpt_images ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Monthly Usage</span>
                <span className="text-muted-foreground">
                  {data?.periods ? `${data.periods.month.images} / ${data?.subscription?.tier?.max_gpt_images ?? '—'}` : (isLoading ? '…' : '—')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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

        <Card className="mb-6">
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

        {/* Detailed API Call History */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed API Call History</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiUsageTable
              data={apiUsageData?.data || []}
              isLoading={apiUsageLoading}
              onViewDetails={(record) => {
                setSelectedRecord(record);
                setModalOpen(true);
              }}
            />
          </CardContent>
        </Card>

        {/* Usage Detail Modal */}
        <UsageDetailModal
          record={selectedRecord}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </main>
    </PageLayout>
  );
}
