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
  // Public items
  { href: "/", label: "Home", icon: Home, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  { href: "/stories", label: "Stories", icon: BookOpen, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  { href: "/blog", label: "Blog", icon: FileText, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  { href: "/about", label: "About", icon: Target, accessLevel: 'public', showInDesktop: true, showInMobile: true },

  // Admin-only items
  { href: "/admin/use-cases", label: "Use Cases", icon: Target, accessLevel: 'admin', showInMobile: true },
];

export const getNavigationItems = (user: any, isAdmin: boolean): NavigationItem[] => {
  return navigationConfig.filter(item => {
    if (item.accessLevel === 'public') return true;
    if (item.accessLevel === 'authenticated') return !!user;
    if (item.accessLevel === 'admin') return user && isAdmin;
    return false;
  });
};

export const getAdminItems = (): NavigationItem[] => {
  return [
    {
      href: "/admin/stories",
      label: "Stories",
      icon: BookOpen,
    },
    {
      href: "/admin/companies",
      label: "Company Profiles",
      icon: Building2,
    },
    {
      href: "/admin/investors", 
      label: "Investors",
      icon: TrendingUp,
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
      href: "/admin/blogs",
      label: "Blog Posts",
      icon: FileText,
    },
    {
      href: "/admin/events",
      label: "Events",
      icon: Calendar,
    },
    {
      href: "/admin/color-themes",
      label: "Color Themes",
      icon: Palette,
    },
    {
      href: "/admin/case-studies",
      label: "Case Studies",
      icon: Briefcase,
    },
    {
      href: "/admin/agents",
      label: "AI Agents",
      icon: Bot,
    },
    {
      href: "/admin/work-summary",
      label: "Work Summary",
      icon: FileBarChart,
    },
    {
      href: "/admin/api-usage",
      label: "API Usage",
      icon: BarChart3,
    }
  ];
};