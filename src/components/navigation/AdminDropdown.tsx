import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminItems } from "@/config/navigationConfig";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AdminDropdownProps {
  navLinkStyles: string;
}

export const AdminDropdown = ({ navLinkStyles }: AdminDropdownProps) => {
  const adminItems = getAdminItems();

  useEffect(() => {
    console.log('[AdminDropdown] Component mounted with adminItems:', adminItems);
    console.log('[AdminDropdown] Admin items count:', adminItems.length);
  }, [adminItems]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={navLinkStyles}
          onPointerEnter={() => console.log('[AdminDropdown] Trigger pointer enter')}
          onPointerLeave={() => console.log('[AdminDropdown] Trigger pointer leave')}
          onClick={() => console.log('[AdminDropdown] Trigger clicked')}
        >
          <Settings className="mr-2 h-4 w-4" />
          Admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[320px]"
        onPointerEnter={() => console.log('[AdminDropdown] Content pointer enter')}
        onPointerLeave={() => console.log('[AdminDropdown] Content pointer leave')}
      >
        {adminItems.length === 0 ? (
          <DropdownMenuItem disabled>
            No admin items found
          </DropdownMenuItem>
        ) : (
          adminItems.map((item, index) => {
            const Icon = item.icon;
            console.log('[AdminDropdown] Rendering item:', item.label, item.href);
            return (
              <DropdownMenuItem key={`${item.href}-${index}`} asChild>
                <Link 
                  to={item.href} 
                  className="flex items-center gap-3 w-full"
                  onClick={() => console.log('[AdminDropdown] Item clicked:', item.label)}
                >
                  {item.label === "Funded Startups" ? (
                    <span className="text-sm font-bold">$$</span>
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};