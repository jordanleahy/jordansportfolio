
/**
 * DEVELOPER NOTES - Navigation Component
 * 
 * Main navigation component with real-time usage updates
 * - Uses useUsageSummary hook for live credit tracking
 * - Integrates with UsageRealtimeProvider for real-time updates
 * - Displays usage progress in user dropdown with tooltips
 * - Supports both admin and regular user views
 * 
 * Real-time Updates:
 * - Automatically updates when image generation completes
 * - Uses centralized QUERY_KEYS.usageSummary for cache management
 * - Connected to api_usage_tracking table changes via websockets
 */

import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Database, FileText, Rocket, LogIn, X, Home, Target, User, Settings, BarChart3, Building2, Calendar, BookOpen, LogOut, Heart, TrendingUp, GitCompare, Activity, Sparkles, ChartBar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useNavigationPreloading } from "@/hooks/useRoutePreloading";
import { useModal } from "@/contexts/ModalContext";
import { useUsageSummary } from "@/hooks/useUsageSummary";
 
 const Navigation = () => {
   const { user, signOut } = useAuth();
   const { isAdmin } = useUserRole();
   const navigate = useNavigate();
   const location = useLocation();
   const { handleMouseEnter, handleFocus } = useNavigationPreloading();
   const { openSettings } = useModal();
 
   // Usage summary (unified)
   const { data: usageData, isLoading: usageLoading, totalCredits, usedCredits, remainingCredits, percentUsed } = useUsageSummary();
  // Simplified active state logic
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" && !location.hash;
    if (path.includes("#")) {
      const [basePath, hash] = path.split('#');
      return location.pathname === basePath && location.hash === `#${hash}`;
    }
    return location.pathname.startsWith(path);
  };

  // Reusable style constants
  const navLinkStyles = "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50";
  const mobileNavItemStyles = "flex items-center gap-3 py-3 px-4 text-base font-medium rounded-lg transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20";

  // Build mobile menu items based on authentication and role
  const mobileMenuItems = user ? [
    // Authenticated user items
    { href: "/stories", label: "Stories", icon: BookOpen },
    
    { href: "settings", label: "Settings", icon: User, userInfo: true, isModal: true },
    // Admin-only items
    ...(isAdmin ? [
      
      { href: "/work-report", label: "Work Reports", icon: ChartBar },
      { href: "/investors", label: "Investors", icon: TrendingUp },
      { href: "/comparisons", label: "Battlecards", icon: GitCompare },
      { href: "/vendors", label: "Vendors", icon: Building2 },
      { href: "/sec", label: "Funded Startups", icon: Database },
      { href: "/admin/comparisons", label: "Admin Battlecards", icon: BarChart3 },
      { href: "/admin/api-usage", label: "API Usage", icon: Activity },
      { href: "/jobs", label: "Jobs", icon: FileText },
      { href: "/agents", label: "AI Agents", icon: Settings },
      { href: "/admin-blog", label: "Blog Admin", icon: BookOpen }
    ] : [])
  ] : [
    // Public items
    { href: "/", label: "Home", icon: Home },
    { href: "/#case-studies", label: "Case Studies", icon: Target },
    { href: "/blog", label: "Blog", icon: FileText },
    { href: "/companies", label: "Companies", icon: Heart },
    { href: "/comparisons", label: "Battlecards", icon: GitCompare },
    { href: "/#about", label: "About", icon: User },
  ];

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
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                {user ? (
                  // Authenticated user navigation
                  <>

                    {/* SEC - Admin Only */}
                    {isAdmin && (
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/sec"
                            className={cn(navLinkStyles, isActive("/sec") && "bg-accent text-accent-foreground")}
                          >
                            <span className="mr-2 text-sm font-bold">$$</span>
                            Funded Startups
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )}

                    {/* Vendors - Admin Only */}
                    {isAdmin && (
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/vendors"
                            className={cn(navLinkStyles, isActive("/vendors") && "bg-accent text-accent-foreground")}
                          >
                            <Building2 className="mr-2 h-4 w-4" />
                            Vendors
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )}

                    {/* Investors - Admin Only */}
                    {isAdmin && (
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/investors"
                            className={cn(navLinkStyles, isActive("/investors") && "bg-accent text-accent-foreground")}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Investors
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )}

                    {/* Battlecards - Admin Only */}
                    {isAdmin && (
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/comparisons"
                            className={cn(navLinkStyles, isActive("/comparisons") && "bg-accent text-accent-foreground")}
                          >
                            <GitCompare className="mr-2 h-4 w-4" />
                            Battlecards
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )}

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/stories"
                          className={cn(navLinkStyles, isActive("/stories") && "bg-accent text-accent-foreground")}
                          onMouseEnter={() => handleMouseEnter('/stories')}
                          onFocus={() => handleFocus('/stories')}
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          Stories
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    {isAdmin && (
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/work-report"
                            className={cn(navLinkStyles, isActive("/work-report") && "bg-accent text-accent-foreground")}
                          >
                            <ChartBar className="mr-2 h-4 w-4" />
                            Work Reports
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )}

                    {/* Admin-only navigation items */}
                    {isAdmin && (
                      <>
                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Link
                              to="/admin/users"
                              className={cn(navLinkStyles, isActive("/admin/users") && "bg-accent text-accent-foreground")}
                            >
                              <User className="mr-2 h-4 w-4" />
                              Users
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Link
                              to="/admin/comparisons"
                              className={cn(navLinkStyles, isActive("/admin/comparisons") && "bg-accent text-accent-foreground")}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Admin Battlecards
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Link
                              to="/admin/api-usage"
                              className={cn(navLinkStyles, isActive("/admin/api-usage") && "bg-accent text-accent-foreground")}
                            >
                              <Activity className="mr-2 h-4 w-4" />
                              API Usage
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Link
                              to="/jobs"
                              className={cn(navLinkStyles, isActive("/jobs") && "bg-accent text-accent-foreground")}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Jobs
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Link
                              to="/agents"
                              className={cn(navLinkStyles, isActive("/agents") && "bg-accent text-accent-foreground")}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              AI Agents
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Link
                              to="/admin-blog"
                              className={cn(navLinkStyles, isActive("/admin-blog") && "bg-accent text-accent-foreground")}
                            >
                              <BookOpen className="mr-2 h-4 w-4" />
                              Blog Admin
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Link
                              to="/admin/seeds"
                              className={cn(navLinkStyles, isActive("/admin/seeds") && "bg-accent text-accent-foreground")}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Seed Management
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      </>
                    )}

                    <NavigationMenuItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Jordan's Story
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
                                J
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">jordan's Lovable</div>
                                <div className="text-xs text-muted-foreground">jordanwilliamleahy@gmail.com</div>
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
                          
                          <DropdownMenuItem onClick={openSettings}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </NavigationMenuItem>
                  </>
                ) : (
                  // Public navigation
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/"
                          className={cn(navLinkStyles, isActive("/") && "bg-accent text-accent-foreground")}
                        >
                          <Home className="mr-2 h-4 w-4" />
                          Home
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>


                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/#case-studies"
                          className={cn(navLinkStyles, isActive("/#case-studies") && "bg-accent text-accent-foreground")}
                          onClick={(e) => handleAnchorClick(e, "/#case-studies")}
                        >
                          <Target className="mr-2 h-4 w-4" />
                          Case Studies
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/blog"
                          className={cn(navLinkStyles, isActive("/blog") && "bg-accent text-accent-foreground")}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Blog
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/companies"
                          className={cn(navLinkStyles, isActive("/companies") && "bg-accent text-accent-foreground")}
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Companies
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/comparisons"
                          className={cn(navLinkStyles, isActive("/comparisons") && "bg-accent text-accent-foreground")}
                        >
                          <GitCompare className="mr-2 h-4 w-4" />
                          Battlecards
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>


                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/#about"
                          className={cn(navLinkStyles, isActive("/#about") && "bg-accent text-accent-foreground")}
                          onClick={(e) => handleAnchorClick(e, "/#about")}
                        >
                          <User className="mr-2 h-4 w-4" />
                          About
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/auth"
                          className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90 focus:bg-primary/90 focus:outline-none"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          Login
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Mobile Navigation */}
            <div className="flex items-center justify-between w-full md:hidden">
              
              {/* Quick Access Icons - Left Side */}
              <div className="flex items-center gap-1">
                {user ? (
                  // Authenticated user quick access icons
                  <>
                    {/* SEC - Admin Only Quick Access */}
                    {isAdmin && (
                      <Link
                        to="/sec"
                        className={cn(
                          "p-2 rounded-lg transition-colors hover:bg-accent",
                          isActive("/sec") && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Database className="h-4 w-4" />
                      </Link>
                    )}
                    {/* Vendors - Admin Only Quick Access */}
                    {isAdmin && (
                      <Link
                        to="/vendors"
                        className={cn(
                          "p-2 rounded-lg transition-colors hover:bg-accent",
                          isActive("/vendors") && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Building2 className="h-4 w-4" />
                      </Link>
                    )}
                    {/* Admin Quick Access Icons */}
                    {isAdmin && (
                      <Link
                        to="/investors"
                        className={cn(
                          "p-2 rounded-lg transition-colors hover:bg-accent",
                          isActive("/investors") && "bg-accent text-accent-foreground"
                        )}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/comparisons"
                        className={cn(
                          "p-2 rounded-lg transition-colors hover:bg-accent",
                          isActive("/comparisons") && "bg-accent text-accent-foreground"
                        )}
                      >
                        <GitCompare className="h-4 w-4" />
                      </Link>
                    )}
                    <Link
                      to="/stories"
                      className={cn(
                        "p-2 rounded-lg transition-colors hover:bg-accent",
                        isActive("/stories") && "bg-accent text-accent-foreground"
                      )}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Link>
                    {/* Admin-only quick access icons */}
                    {isAdmin && (
                      <>
                        <Link
                          to="/admin/comparisons"
                          className={cn(
                            "p-2 rounded-lg transition-colors hover:bg-accent",
                            isActive("/admin/comparisons") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                         <Link
                           to="/admin/api-usage"
                           className={cn(
                             "p-2 rounded-lg transition-colors hover:bg-accent",
                             isActive("/admin/api-usage") && "bg-accent text-accent-foreground"
                           )}
                         >
                           <Activity className="h-4 w-4" />
                         </Link>
                         <Link
                           to="/jobs"
                           className={cn(
                             "p-2 rounded-lg transition-colors hover:bg-accent",
                             isActive("/jobs") && "bg-accent text-accent-foreground"
                           )}
                         >
                           <FileText className="h-4 w-4" />
                         </Link>
                        <Link
                          to="/agents"
                          className={cn(
                            "p-2 rounded-lg transition-colors hover:bg-accent",
                            isActive("/agents") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                        <Link
                          to="/admin-blog"
                          className={cn(
                            "p-2 rounded-lg transition-colors hover:bg-accent",
                            isActive("/admin-blog") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  // Public user quick access icons
                  <>
                    <Link
                      to="/"
                      className={cn(
                        "p-2 rounded-lg transition-colors hover:bg-accent",
                        isActive("/") && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Home className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/blog"
                      className={cn(
                        "p-2 rounded-lg transition-colors hover:bg-accent",
                        isActive("/blog") && "bg-accent text-accent-foreground"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>

              {/* Hamburger Menu - Far Right */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
              
              <SheetContent side="right" className="w-80 p-0 bg-background/95 backdrop-blur-md border-l" hideClose>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h2 className="text-lg font-semibold text-foreground">Menu</h2>
                    <SheetClose asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent/50 rounded-full">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                  
                   {/* Navigation Links */}
                  <nav className="flex flex-col p-4 space-y-1 flex-1">
                    {mobileMenuItems.map((item, index) => {
                      const Icon = item.icon;
                      const itemIsActive = isActive(item.href);
                      
                      // Special handling for Settings item to show user info
                      if (item.userInfo && user) {
                        return (
                          <SheetClose key={item.href} asChild>
                            <button
                              onClick={() => {
                                if (item.isModal) {
                                  openSettings();
                                }
                              }}
                              className={cn(
                                "flex flex-col gap-2 py-3 px-4 text-base font-medium rounded-lg bg-accent/20 border border-accent/30 transition-all duration-200 hover:bg-accent/30 hover:scale-[1.02] active:scale-[0.98] w-full text-left"
                              )}
                              style={{ 
                                animationDelay: `${index * 50}ms`,
                                animationFillMode: 'both'
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-primary" />
                                <span className="font-semibold text-primary">{item.label}</span>
                              </div>
                            </button>
                          </SheetClose>
                        );
                      }
                      
                      return (
                        <SheetClose key={item.href} asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              mobileNavItemStyles,
                              itemIsActive && "bg-accent text-accent-foreground font-semibold shadow-sm"
                            )}
                            style={{ 
                              animationDelay: `${index * 50}ms`,
                              animationFillMode: 'both'
                            }}
                            onClick={(e) => handleAnchorClick(e, item.href)}
                          >
                            <Icon className={cn(
                              "h-5 w-5 transition-colors",
                              itemIsActive ? "text-accent-foreground" : "text-muted-foreground"
                            )} />
                            <span>{item.label}</span>
                            {itemIsActive && (
                              <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>
                  
                  {/* Auth Button */}
                  <div className="p-4 border-t border-border/50">
                    <SheetClose asChild>
                      {user ? (
                        <Button 
                          onClick={handleSignOut}
                          className="flex items-center justify-center gap-3 py-3 px-6 text-base font-medium w-full bg-secondary text-secondary-foreground rounded-lg transition-all duration-200 hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98] shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Sign Out</span>
                        </Button>
                      ) : (
                        <Link 
                          to="/auth" 
                          className="flex items-center justify-center gap-3 py-3 px-6 text-base font-medium bg-primary text-primary-foreground rounded-lg transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <LogIn className="h-5 w-5" />
                          <span>Sign In</span>
                        </Link>
                      )}
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
    </TooltipProvider>
  );
};

export default Navigation;
