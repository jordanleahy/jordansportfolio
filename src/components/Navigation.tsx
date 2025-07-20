
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Building, Database, FileText, Calendar, Briefcase, Bot, Rocket } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string }) => (
    <Link
      to={href}
      className={cn(
        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        isActive(href) && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => setIsOpen(false)}
      {...props}
    >
      {children}
    </Link>
  );

  const NavigationContent = () => (
    <>
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className={cn(isActive("/vendors") && "bg-accent text-accent-foreground")}>
              <Building className="mr-2 h-4 w-4" />
              Vendors
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <NavLink
                      href="/vendors"
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    >
                      <Building className="h-6 w-6" />
                      <div className="mb-2 mt-4 text-lg font-medium">
                        All Vendors
                      </div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        Comprehensive directory of technology vendors across all categories
                      </p>
                    </NavLink>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <NavLink href="/vendors/rcm">
                      <div className="text-base font-medium leading-none">RCM Companies</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Revenue Cycle Management vendors
                      </p>
                    </NavLink>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <NavLink href="/vendors/healthcare">
                      <div className="text-base font-medium leading-none">Healthcare Tech</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Healthcare technology solutions
                      </p>
                    </NavLink>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <NavLink href="/vendors/fintech">
                      <div className="text-base font-medium leading-none">FinTech</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Financial technology platforms
                      </p>
                    </NavLink>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                to="/sec"
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                  isActive("/sec") && "bg-accent text-accent-foreground"
                )}
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
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                  isActive("/blog") && "bg-accent text-accent-foreground"
                )}
              >
                <FileText className="mr-2 h-4 w-4" />
                Blog
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                to="/calendar"
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                  isActive("/calendar") && "bg-accent text-accent-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                to="/jobs"
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                  isActive("/jobs") && "bg-accent text-accent-foreground"
                )}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Jobs
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                to="/agents"
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                  isActive("/agents") && "bg-accent text-accent-foreground"
                )}
              >
                <Bot className="mr-2 h-4 w-4" />
                Agents
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                to="/ascertain-to-the-moon"
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                  isActive("/ascertain-to-the-moon") && "bg-accent text-accent-foreground"
                )}
              >
                <Rocket className="mr-2 h-4 w-4" />
                To The Moon
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Vendors</h4>
              <div className="ml-4 space-y-2">
                <NavLink href="/vendors">All Vendors</NavLink>
                <NavLink href="/vendors/rcm">RCM Companies</NavLink>
                <NavLink href="/vendors/healthcare">Healthcare Tech</NavLink>
                <NavLink href="/vendors/fintech">FinTech</NavLink>
              </div>
            </div>
            <NavLink href="/sec">SEC Data</NavLink>
            <NavLink href="/blog">Blog</NavLink>
            <NavLink href="/calendar">Calendar</NavLink>
            <NavLink href="/jobs">Jobs</NavLink>
            <NavLink href="/agents">Agents</NavLink>
            <NavLink href="/ascertain-to-the-moon">To The Moon</NavLink>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">Jordan Leahy</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <NavigationContent />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
