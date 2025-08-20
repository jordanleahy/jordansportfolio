import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface RealtimeImageStatusMonitorProps {
  postId: string;
  aspectRatio: string;
  className?: string;
}

interface StatusInfo {
  status: string;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const RealtimeImageStatusMonitor: React.FC<RealtimeImageStatusMonitorProps> = ({
  postId,
  aspectRatio,
  className = ''
}) => {
  const [status, setStatus] = useState<string>('none');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    let channel: any = null;

    const setupMonitoring = async () => {
      // Get initial status
      const statusField = `image_${aspectRatio.replace(':', '_')}_status`;
      
      const { data, error } = await supabase
        .from('social_media_posts')
        .select(`${statusField}, updated_at`)
        .eq('id', postId)
        .maybeSingle();

      if (!error && data) {
        setStatus((data as any)[statusField] || 'none');
        setLastUpdated(new Date((data as any).updated_at));
      }

      // Setup real-time monitoring
      channel = supabase
        .channel(`status-monitor-${postId}-${aspectRatio}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'social_media_posts',
            filter: `id=eq.${postId}`
          },
          (payload) => {
            const newStatus = (payload.new as any)?.[statusField];
            const updatedAt = payload.new?.updated_at;
            
            if (newStatus !== undefined) {
              setStatus(newStatus || 'none');
              if (updatedAt) {
                setLastUpdated(new Date(updatedAt));
              }
              
              console.log('📡 Status monitor update:', {
                postId,
                aspectRatio,
                newStatus,
                timestamp: new Date().toISOString()
              });
            }
          }
        )
        .subscribe();
    };

    setupMonitoring();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [postId, aspectRatio]);

  const getStatusInfo = (status: string): StatusInfo => {
    switch (status) {
      case 'generating':
        return {
          status,
          label: 'Generating...',
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          variant: 'default'
        };
      case 'complete':
        return {
          status,
          label: 'Complete',
          icon: <CheckCircle2 className="h-3 w-3" />,
          variant: 'secondary'
        };
      case 'failed':
      case 'error':
        return {
          status,
          label: 'Failed',
          icon: <AlertCircle className="h-3 w-3" />,
          variant: 'destructive'
        };
      case 'none':
      default:
        return {
          status,
          label: 'Not started',
          icon: <Clock className="h-3 w-3" />,
          variant: 'outline'
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={statusInfo.variant} className="flex items-center gap-1 text-xs">
        {statusInfo.icon}
        {aspectRatio} - {statusInfo.label}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {lastUpdated.toLocaleTimeString()}
      </span>
    </div>
  );
};