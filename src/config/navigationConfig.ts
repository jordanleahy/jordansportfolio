import { 
  Home, 
  BookOpen, 
  Building2, 
  TrendingUp, 
  Package, 
  GitCompare, 
  FileText, 
  Calendar, 
  Palette, 
  Briefcase, 
  Bot,
  FileBarChart,
  BarChart3,
  Target,
  type LucideIcon 
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  accessLevel?: 'public' | 'authenticated' | 'admin';
  showInDesktop?: boolean;
  showInMobile?: boolean;
  showInQuickAccess?: boolean;
  isModal?: boolean;
  userInfo?: boolean;
}

export const navigationConfig: NavigationItem[] = [
  // Public items (marketing routes)
  { href: "/", label: "Home", icon: Home, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  { href: "/stories", label: "Stories", icon: BookOpen, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  { href: "/blog", label: "Blog", icon: FileText, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  { href: "/about", label: "About", icon: Target, accessLevel: 'public', showInDesktop: true, showInMobile: true },

  // Authenticated items
  { href: "/home", label: "Dashboard", icon: Home, accessLevel: 'authenticated', showInDesktop: true, showInMobile: true },
  { href: "/stories", label: "My Stories", icon: BookOpen, accessLevel: 'authenticated', showInDesktop: true, showInMobile: true },
  { href: "/account", label: "Account", icon: Target, accessLevel: 'authenticated', showInDesktop: true, showInMobile: true },

  // Admin-only items
  { href: "/admin/use-cases", label: "Use Cases", icon: Target, accessLevel: 'admin', showInMobile: true },
];

export const getNavigationItems = (user: any, isAdmin: boolean, hideMarketingRoutes: boolean = false): NavigationItem[] => {
  const marketingRoutes = ['/', '/about', '/blog'];
  
  return navigationConfig.filter(item => {
    // Filter by access level
    let hasAccess = false;
    if (item.accessLevel === 'public') hasAccess = true;
    if (item.accessLevel === 'authenticated') hasAccess = !!user;
    if (item.accessLevel === 'admin') hasAccess = user && isAdmin;
    
    if (!hasAccess) return false;
    
    // For authenticated users, hide marketing routes if requested
    if (hideMarketingRoutes && user && item.accessLevel === 'public' && marketingRoutes.includes(item.href)) {
      return false;
    }
    
    return true;
  });
};

export const getAdminItems = (): NavigationItem[] => {
  return [
    {
      href: "/sec",
      label: "SEC Filings",
      icon: FileBarChart,
    },
    {
      href: "/admin/vendors",
      label: "Vendors",
      icon: Package,
    },
    {
      href: "/admin/comparisons",
      label: "Comparisons", 
      icon: GitCompare,
    },
    {
      href: "/admin/use-cases",
      label: "Use Cases",
      icon: Target,
    },
    {
      href: "/admin-blog",
      label: "Blog Posts",
      icon: FileText,
    },
    {
      href: "/agents",
      label: "AI Agents",
      icon: Bot,
    },
    {
      href: "/work-report",
      label: "Work Reports",
      icon: FileBarChart,
    },
    {
      href: "/admin/api-usage",
      label: "API Usage",
      icon: BarChart3,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: TrendingUp,
    },
    {
      href: "/investors",
      label: "Investors",
      icon: TrendingUp,
    }
  ];
};