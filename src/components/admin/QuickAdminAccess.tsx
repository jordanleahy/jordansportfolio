import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Users, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const QuickAdminAccess: React.FC = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card border rounded-lg shadow-lg p-4 space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Admin Tools</h3>
        
        <div className="flex flex-col space-y-1">
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <Link to="/admin/prompts" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Prompt Manager</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <Link to="/admin/users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <Link to="/admin-blog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Blog</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <Link to="/admin/subscription-analytics" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Analytics</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};