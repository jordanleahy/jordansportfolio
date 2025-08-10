import { NavigationMenuContent, NavigationMenuItem, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminItems } from "@/config/navigationConfig";

interface AdminDropdownProps {
  navLinkStyles: string;
}

export const AdminDropdown = ({ navLinkStyles }: AdminDropdownProps) => {
  const adminItems = getAdminItems();

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={navLinkStyles}>
        <Settings className="mr-2 h-4 w-4" />
        Admin
      </NavigationMenuTrigger>
      <NavigationMenuContent className="z-50 bg-background">
        <div className="grid gap-1 p-2 w-[280px]">
          {adminItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.href}
                to={item.href} 
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                {item.label === "Funded Startups" ? (
                  <span className="text-sm font-bold">$$</span>
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};