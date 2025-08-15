import { BookOpen, Database, FileText, Home, Target, User, Settings, BarChart3, Building2, Calendar, Heart, TrendingUp, GitCompare, Activity, Sparkles, ChartBar, LucideIcon } from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  accessLevel: 'public' | 'authenticated' | 'admin';
  showInDesktop?: boolean;
  showInMobile?: boolean;
  showInQuickAccess?: boolean;
  isModal?: boolean;
  userInfo?: boolean;
}

export const navigationConfig: NavigationItem[] = [
  // Public items
  { href: "/", label: "Home", icon: Home, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  { href: "/blog", label: "Blog", icon: FileText, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  { href: "/library", label: "Library", icon: BookOpen, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  { href: "/about", label: "About", icon: User, accessLevel: 'public', showInDesktop: true, showInMobile: true },

  { href: "/stories", label: "Stories", icon: BookOpen, accessLevel: 'public', showInDesktop: true, showInMobile: true },
  
  // Authenticated user items
  { href: "settings", label: "Settings", icon: User, accessLevel: 'authenticated', showInMobile: true, isModal: true, userInfo: true },

  // Admin-only items
  { href: "/sec", label: "Funded Startups", icon: Database, accessLevel: 'admin', showInMobile: true },
  { href: "/vendors", label: "Vendors", icon: Building2, accessLevel: 'admin', showInMobile: true },
  { href: "/investors", label: "Investors", icon: TrendingUp, accessLevel: 'admin', showInMobile: true },
  { href: "/work-report", label: "Work Reports", icon: ChartBar, accessLevel: 'admin', showInMobile: true },
  { href: "/admin/users", label: "Users", icon: User, accessLevel: 'admin', showInMobile: true },
  { href: "/admin/comparisons", label: "Admin Battlecards", icon: BarChart3, accessLevel: 'admin', showInMobile: true },
  { href: "/admin/api-usage", label: "API Usage", icon: Activity, accessLevel: 'admin', showInMobile: true },
  { href: "/jobs", label: "Jobs", icon: FileText, accessLevel: 'admin', showInMobile: true },
  { href: "/agents", label: "AI Agents", icon: Settings, accessLevel: 'admin', showInMobile: true },
  { href: "/admin-blog", label: "Blog Admin", icon: BookOpen, accessLevel: 'admin', showInMobile: true },
  { href: "/admin/seeds", label: "Seed Management", icon: Settings, accessLevel: 'admin', showInMobile: true },
];

export const getNavigationItems = (user: any, isAdmin: boolean) => {
  return navigationConfig.filter(item => {
    if (item.accessLevel === 'public') return !user; // Only show to unauthenticated users
    if (item.accessLevel === 'authenticated') return !!user;
    if (item.accessLevel === 'admin') return user && isAdmin;
    return false;
  });
};

export const getAdminItems = () => {
  return navigationConfig.filter(item => item.accessLevel === 'admin');
};