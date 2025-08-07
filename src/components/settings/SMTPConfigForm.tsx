import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface SMTPConfig {
  provider: string;
  host: string;
  port: number;
  username: string;
  sender_email: string;
  sender_name: string;
  is_active: boolean;
}

export function SMTPConfigForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<SMTPConfig>({
    provider: 'resend',
    host: 'smtp.resend.com',
    port: 465,
    username: 'resend',
    sender_email: '',
    sender_name: '',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to configure SMTP settings.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('smtp_configurations')
        .upsert({
          user_id: user.id,
          ...config,
        });

      if (error) throw error;

      toast({
        title: "SMTP Configuration Saved",
        description: "Your SMTP settings have been successfully configured.",
      });
    } catch (error: any) {
      toast({
        title: "Configuration Failed",
        description: error.message || "Failed to save SMTP configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMTP Configuration</CardTitle>
        <CardDescription>
          Configure your custom SMTP settings for email delivery. If you're using Resend, 
          use your API key as the password and "resend" as the username.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                id="host"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                placeholder="smtp.resend.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                placeholder="465"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              placeholder="resend"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender_email">Sender Email</Label>
            <Input
              id="sender_email"
              type="email"
              value={config.sender_email}
              onChange={(e) => setConfig({ ...config, sender_email: e.target.value })}
              placeholder="noreply@yourdomain.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender_name">Sender Name</Label>
            <Input
              id="sender_name"
              value={config.sender_name}
              onChange={(e) => setConfig({ ...config, sender_name: e.target.value })}
              placeholder="Your App Name"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
            />
            <Label htmlFor="is_active">Enable SMTP Configuration</Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save SMTP Configuration'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Resend SMTP Settings</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Host: smtp.resend.com</li>
            <li>• Port: 465 (SSL) or 587 (TLS)</li>
            <li>• Username: resend</li>
            <li>• Password: Your Resend API key</li>
            <li>• Make sure your domain is verified in Resend</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}