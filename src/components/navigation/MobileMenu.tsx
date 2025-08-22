import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { NavigationItem, getNavigationItems } from "@/config/navigationConfig";

interface MobileMenuProps {
  user: any;
  isAdmin: boolean;
  onSignOut: () => void;
}

export const MobileMenu = ({ user, isAdmin, onSignOut }: MobileMenuProps) => {
  const location = useLocation();
  
  const menuItems = getNavigationItems(user, isAdmin, !!user).filter(item => item.showInMobile);
  
  const mobileNavItemStyles = "flex items-center gap-3 py-3 px-4 text-base font-medium rounded-lg transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20";

  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    if (href.includes('#')) {
      const [basePath, anchor] = href.split('#');
      
      if (location.pathname !== basePath) {
        return;
      }
      
      e.preventDefault();
      const element = document.getElementById(anchor);
      if (element) {
        const headerHeight = 56;
        const elementPosition = element.offsetTop - headerHeight;
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="inline-flex items-center justify-center rounded-md h-9 w-9 md:hidden"
          size="sm"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="pr-0 w-[300px] sm:w-[350px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-bold">Jordan Leahy</span>
            </Link>
            <SheetClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>

          <nav className="flex-1 px-4 py-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                
                return (
                  <SheetClose key={item.href} asChild>
                    <Link
                      to={item.href}
                      className={mobileNavItemStyles}
                      onClick={(e) => handleAnchorClick(e, item.href)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </nav>

          <div className="border-t px-4 py-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {(user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{user?.user_metadata?.first_name || user?.user_metadata?.full_name || 'User'}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  </div>
                </div>
                <SheetClose asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onSignOut}
                  >
                    <span>Sign out</span>
                  </Button>
                </SheetClose>
              </div>
            ) : (
              <SheetClose asChild>
                <Link to="/auth" className="block">
                  <Button className="w-full justify-start">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in
                  </Button>
                </Link>
              </SheetClose>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};