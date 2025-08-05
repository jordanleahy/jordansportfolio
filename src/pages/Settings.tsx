import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Database,
  CreditCard,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Edit2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || 'Jordan Leahy',
    email: user?.email || '',
    bio: 'Product designer and entrepreneur',
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion requested",
      description: "We'll send you an email with instructions to delete your account.",
      variant: "destructive",
    });
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      
      setNewPassword('');
      setShowPassword(false);
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message || "An error occurred while updating your password.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <PageLayout>
      <Helmet>
        <title>Settings - AI Content Platform</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">
                  Manage your account settings and preferences
                </p>
              </div>
              {subscriptionStatus?.subscription && (
                <Badge 
                  variant={subscriptionStatus.subscription.tier.name === 'Premium' ? 'default' : 'secondary'}
                  className="hidden sm:flex"
                >
                  {subscriptionStatus.subscription.tier.name} Plan
                </Badge>
              )}
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                {!isMobile && (
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                          disabled={!isEditing}
                          type="email"
                        />
                      </div>
                    </div>


                    {isEditing && (
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleSaveProfile}>
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Subscription Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscriptionStatus?.subscription ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{subscriptionStatus.subscription.tier.name} Plan</p>
                            <p className="text-sm text-muted-foreground">
                              ${(subscriptionStatus.subscription.tier.price_cents / 100).toFixed(0)}/month
                            </p>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage Subscription
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">No active subscription</p>
                        <Button variant="outline" size="sm">
                          View Plans
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>



              {/* Security Tab - Desktop only */}
              {!isMobile && (
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security & Privacy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Change Password</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleUpdatePassword}
                          disabled={isUpdatingPassword || !newPassword}
                        >
                          {isUpdatingPassword ? "Updating..." : "Update Password"}
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium text-destructive">Danger Zone</h4>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSignOut}
                            className="w-full justify-start"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteAccount}
                            className="w-full justify-start"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            {/* Mobile-only bottom actions */}
            {isMobile && (
              <div className="space-y-4 pb-20">
                <Card>
                  <CardContent className="pt-6 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      className="w-full justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;