import { PageLayout } from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ImageIcon, MailIcon, UserIcon } from "lucide-react";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface UserStats {
  totalImages: number;
  imagesThisMonth: number;
  imagesThisWeek: number;
  totalCost: number;
}

const UserDashboard = () => {
  const { user } = useAuth();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async (): Promise<UserStats> => {
      if (!user?.id) {
        return { totalImages: 0, imagesThisMonth: 0, imagesThisWeek: 0, totalCost: 0 };
      }

      // Get total images
      const { count: totalImages } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get images this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: imagesThisMonth } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      // Get images this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const { count: imagesThisWeek } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfWeek.toISOString());

      // Get total estimated cost
      const { data: costData } = await supabase
        .from('images')
        .select('estimated_cost')
        .eq('user_id', user.id);

      const totalCost = costData?.reduce((sum, img) => sum + (Number(img.estimated_cost) || 0), 0) || 0;

      return {
        totalImages: totalImages || 0,
        imagesThisMonth: imagesThisMonth || 0,
        imagesThisWeek: imagesThisWeek || 0,
        totalCost,
      };
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Please sign in to view your dashboard.</p>
        </div>
      </PageLayout>
    );
  }

  const displayName = profile?.full_name || 
    (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
    profile?.first_name ||
    'User';

  const userEmail = profile?.email || user.email || 'No email provided';
  const createdDate = profile?.created_at ? new Date(profile.created_at) : user.created_at ? new Date(user.created_at) : new Date();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              User Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Welcome back, {displayName}!
            </p>
          </div>

          {/* User Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* User Name */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Full Name</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profileLoading ? (
                    <div className="h-6 bg-muted animate-pulse rounded" />
                  ) : (
                    displayName
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email</CardTitle>
                <MailIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium truncate">
                  {profileLoading ? (
                    <div className="h-6 bg-muted animate-pulse rounded" />
                  ) : (
                    userEmail
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Created Date */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {profileLoading ? (
                    <div className="h-6 bg-muted animate-pulse rounded" />
                  ) : (
                    format(createdDate, 'MMM dd, yyyy')
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Total Images */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Images</CardTitle>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stats?.totalImages || 0
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Image Generation Statistics</CardTitle>
                <CardDescription>
                  Your image creation activity breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">This Week</span>
                      <Badge variant="secondary">{stats?.imagesThisWeek || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">This Month</span>
                      <Badge variant="secondary">{stats?.imagesThisMonth || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">All Time</span>
                      <Badge variant="default">{stats?.totalImages || 0}</Badge>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Estimated Total Cost</span>
                        <Badge variant="outline">
                          ${(stats?.totalCost || 0).toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">User ID</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {user.id.slice(-8)}...
                      </code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Email Verified</span>
                      <Badge variant={user.email_confirmed_at ? "default" : "destructive"}>
                        {user.email_confirmed_at ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Last Sign In</span>
                      <span className="text-xs text-muted-foreground">
                        {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM dd, HH:mm') : 'Never'}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default UserDashboard;