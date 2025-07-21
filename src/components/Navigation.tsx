
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Database, FileText, Rocket, LogIn, X, Home, Target, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Simplified active state logic
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" && !location.hash;
    if (path.includes("#")) return location.pathname + location.hash === path;
    return location.pathname.startsWith(path);
  };

  // Reusable style constants
  const navLinkStyles = "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50";
  const mobileNavItemStyles = "flex items-center gap-3 py-3 px-4 text-base font-medium rounded-lg transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20";

  const mobileMenuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#case-studies", label: "Case Studies", icon: Target },
    { href: "/#about", label: "About", icon: User },
    { href: "/sec", label: "SEC Data", icon: Database },
    { href: "/blog", label: "Blog", icon: FileText },
  ];

  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    if (href.includes('#')) {
      e.preventDefault();
      const anchor = href.split('#')[1];
      const element = document.getElementById(anchor);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:sticky md:left-auto md:right-auto">
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
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/sec"
                      className={cn(navLinkStyles, isActive("/sec") && "bg-accent text-accent-foreground")}
                    >
                      <Database className="mr-2 h-4 w-4" />
                      SEC Data
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
                      to="/ascertain-to-the-moon"
                      className={cn(navLinkStyles, isActive("/ascertain-to-the-moon") && "bg-accent text-accent-foreground")}
                    >
                      <Rocket className="mr-2 h-4 w-4" />
                      To The Moon
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {!user && (
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
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
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
                          onClick={signOut}
                          className="flex items-center justify-center gap-3 py-3 px-6 text-base font-medium w-full bg-secondary text-secondary-foreground rounded-lg transition-all duration-200 hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98] shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        >
                          <LogIn className="h-5 w-5 rotate-180" />
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
    </header>
  );
};

export default Navigation;
