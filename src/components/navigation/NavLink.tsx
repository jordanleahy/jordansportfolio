import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NavigationItem } from "@/config/navigationConfig";

interface NavLinkProps {
  item: NavigationItem;
  className?: string;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}

export const NavLink = ({ item, className, onMouseEnter, onFocus, onClick }: NavLinkProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" && !location.hash;
    if (path.includes("#")) {
      const [basePath, hash] = path.split('#');
      return location.pathname === basePath && location.hash === `#${hash}`;
    }
    return location.pathname.startsWith(path);
  };

  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      className={cn(className, isActive(item.href) && "bg-accent text-accent-foreground")}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onClick={onClick}
    >
      <Icon className="mr-2 h-4 w-4" />
      {item.label}
    </Link>
  );
};