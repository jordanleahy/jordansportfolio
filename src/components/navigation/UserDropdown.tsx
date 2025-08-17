import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { User, Settings, LogOut } from "lucide-react";

interface UserDropdownProps {
  user: any;
  usageData: any;
  usedCredits: number;
  totalCredits: number;
  percentUsed: number;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const UserDropdown = ({ 
  user, 
  usageData, 
  usedCredits, 
  totalCredits, 
  percentUsed, 
  onOpenSettings, 
  onSignOut 
}: UserDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
        >
          <User className="mr-2 h-4 w-4" />
          {user?.user_metadata?.full_name || `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() || user?.email || 'User'}'s Story
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-background/95 backdrop-blur-sm border shadow-lg z-50"
      >
        {/* User Info Section */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {(user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{user?.user_metadata?.full_name || `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() || user?.email || 'User'}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          
          {/* Usage Section */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-2 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Usage</span>
                  <span className="text-sm text-muted-foreground">{usedCredits.toLocaleString()} / {totalCredits.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${percentUsed}%` }}></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-xs text-muted-foreground">{usageData?.isAdmin ? 'Admin override' : 'Using plan credits'}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-background border shadow-lg">
              <div className="flex items-center gap-2 p-1">
                <span className="text-sm font-medium">Monthly Usage {usedCredits.toLocaleString()} / {totalCredits.toLocaleString()}</span>
              </div>
              <div className="w-24 bg-muted rounded-full h-1 mt-1">
                <div className="bg-primary h-1 rounded-full" style={{ width: `${percentUsed}%` }}></div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};