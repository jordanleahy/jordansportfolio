
import { Link, useLocation } from "react-router-dom";
import { Building2, Calendar, FileText, Settings, BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigationPreloading } from "@/hooks/useRoutePreloading";

const OptimizedSubNavigation = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const { handleMouseEnter, handleFocus } = useNavigationPreloading();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const navItems = [
    { 
      path: "/vendors", 
      label: "Vendors", 
      icon: Building2,
      isActive: location.pathname.startsWith("/vendors")
    },
    { 
      path: "/calendar", 
      label: "Calendar", 
      icon: Calendar,
      isActive: location.pathname === "/calendar"
    },
    { 
      path: "/jobs", 
      label: "Jobs", 
      icon: FileText,
      isActive: location.pathname === "/jobs"
    },
    { 
      path: "/agents", 
      label: "AI Agents", 
      icon: Settings,
      isActive: location.pathname === "/agents"
    },
    ...(isAdmin ? [{ 
      path: "/admin-blog", 
      label: "Blog Admin", 
      icon: BookOpen,
      isActive: location.pathname === "/admin-blog"
    }] : [])
  ];

  return (
    <div className="sticky top-[65px] z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Main Navigation Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-2 hover:bg-accent/10 ${
                  item.isActive 
                    ? "text-primary bg-accent/20" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onMouseEnter={() => handleMouseEnter(item.path)}
                onFocus={() => handleFocus(item.path)}
              >
                <item.icon size={16} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut size={16} className="mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OptimizedSubNavigation;
