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
}

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