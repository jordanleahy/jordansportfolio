import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminItems } from "@/config/navigationConfig";
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={navLinkStyles}
        >
          <Settings className="mr-2 h-4 w-4" />
          Admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[320px]">
        {adminItems.length === 0 ? (
          <DropdownMenuItem disabled>
            No admin items found
          </DropdownMenuItem>
        ) : (
          adminItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={`${item.href}-${index}`} asChild>
                <Link 
                  to={item.href} 
                  className="flex items-center gap-3 w-full"
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