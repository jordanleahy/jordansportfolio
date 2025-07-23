
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { LogIn, LogOut, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinkStyles = "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50";

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-1 items-center justify-between space-x-2">
      <div className="flex items-center space-x-2">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold">Jordan Leahy</span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-2">
        {user ? (
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className={navLinkStyles}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        ) : (
          <NavigationMenu>
            <NavigationMenuList>
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
            </NavigationMenuList>
          </NavigationMenu>
        )}
      </div>
    </div>
  );
};

export default Navigation;
