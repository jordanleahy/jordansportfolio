/**
 * DEVELOPER NOTES - Navigation Component
 * 
 * Main navigation component with real-time usage updates
 * - Uses useUsageSummary hook for live credit tracking with direct database queries
 * - Real-time updates via built-in websocket subscription in useUsageSummary
 * - Displays usage progress in user dropdown with tooltips
 * - Supports both admin and regular user views
 * 
 * Real-time Updates:
 * - Automatically updates when image generation completes
 * - Direct subscription to api_usage_tracking table changes
 * - Immediate refetch on any new usage record
 */

import { Button } from "@/components/ui/button";
import { BookOpen, LogIn } from "lucide-react";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useNavigationPreloading } from "@/hooks/useRoutePreloading";
import { useModal } from "@/contexts/ModalContext";
import { useUsageSummary } from "@/hooks/useUsageSummary";
import { getNavigationItems } from "@/config/navigationConfig";
import { NavLink } from "@/components/navigation/NavLink";
import { AdminDropdown } from "@/components/navigation/AdminDropdown";
import { UserDropdown } from "@/components/navigation/UserDropdown";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { useEffect } from "react";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { handleMouseEnter, handleFocus } = useNavigationPreloading();
  const { openSettings } = useModal();

  // Usage summary (unified) - always call hook to maintain consistent hook order
  const { data: usageData, isLoading: usageLoading, totalCredits, usedCredits, remainingCredits, percentUsed } = useUsageSummary();


  // Reusable style constants
  const navLinkStyles = "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50";

  // Get navigation items based on user state
  const publicNavItems = getNavigationItems(null, false).filter(item => item.showInDesktop);
  const authenticatedNavItems = getNavigationItems(user, false).filter(item => item.showInDesktop);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    if (href.includes('#')) {
      const [basePath, anchor] = href.split('#');
      
      // If we're not on the target page, navigate first
      if (location.pathname !== basePath) {
        // Let the Link handle navigation normally
        return;
      }
      
      // If we're already on the page, prevent default and scroll
      e.preventDefault();
      const element = document.getElementById(anchor);
      if (element) {
        // Account for sticky header height
        const headerHeight = 56; // 14 * 4 = 56px (h-14)
        const elementPosition = element.offsetTop - headerHeight;
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">Jordan Leahy</span>
            </Link>
          </div>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                {user ? (
                  // Authenticated user navigation
                  <>
                    {isAdmin && <AdminDropdown navLinkStyles={navLinkStyles} />}

                    {publicNavItems.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        className={navLinkStyles}
                        onClick={(e) => handleAnchorClick(e, item.href)}
                        onMouseEnter={() => handleMouseEnter(item.href)}
                        onFocus={() => handleFocus(item.href)}
                      />
                    ))}

                    <UserDropdown
                      user={user}
                      usageData={usageData}
                      usedCredits={usedCredits}
                      totalCredits={totalCredits}
                      percentUsed={percentUsed}
                      onOpenSettings={openSettings}
                      onSignOut={handleSignOut}
                    />
                  </>
                ) : (
                  // Public navigation
                  <>
                    {publicNavItems.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        className={navLinkStyles}
                        onClick={(e) => handleAnchorClick(e, item.href)}
                      />
                    ))}

                    <Link
                      to="/auth"
                      className={cn(navLinkStyles, "bg-primary text-primary-foreground hover:bg-primary/90")}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Navigation */}
            <MobileMenu 
              user={user} 
              isAdmin={isAdmin} 
              onSignOut={handleSignOut} 
            />
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default Navigation;