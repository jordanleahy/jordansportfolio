import { NavigationMenuContent, NavigationMenuItem, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminItems } from "@/config/navigationConfig";
import { useEffect, useState } from "react";

interface AdminDropdownProps {
  navLinkStyles: string;
}

export const AdminDropdown = ({ navLinkStyles }: AdminDropdownProps) => {
  const adminItems = getAdminItems();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log('[AdminDropdown] Component mounted with adminItems:', adminItems);
    console.log('[AdminDropdown] Admin items count:', adminItems.length);
  }, [adminItems]);

  useEffect(() => {
    console.log('[AdminDropdown] Open state changed:', isOpen);
  }, [isOpen]);

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger 
        className={navLinkStyles}
        onPointerEnter={() => console.log('[AdminDropdown] Trigger pointer enter')}
        onPointerLeave={() => console.log('[AdminDropdown] Trigger pointer leave')}
        onClick={() => console.log('[AdminDropdown] Trigger clicked')}
      >
        <Settings className="mr-2 h-4 w-4" />
        Admin
      </NavigationMenuTrigger>
      <NavigationMenuContent 
        className="z-[100] bg-background border border-border shadow-lg"
        onPointerEnter={() => console.log('[AdminDropdown] Content pointer enter')}
        onPointerLeave={() => console.log('[AdminDropdown] Content pointer leave')}
      >
        <div className="grid gap-1 p-4 w-[320px] bg-background">
          {adminItems.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground">No admin items found</div>
          ) : (
            adminItems.map((item, index) => {
              const Icon = item.icon;
              console.log('[AdminDropdown] Rendering item:', item.label, item.href);
              return (
                <Link 
                  key={`${item.href}-${index}`}
                  to={item.href} 
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => console.log('[AdminDropdown] Item clicked:', item.label)}
                >
                  {item.label === "Funded Startups" ? (
                    <span className="text-sm font-bold">$$</span>
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })
          )}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};