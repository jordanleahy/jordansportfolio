
import {
  Calendar,
  FileText,
  Users,
  Briefcase,
  Building,
  CalendarDays,
  Bot,
  BookOpen,
  Lightbulb,
  Home,
  LogIn,
} from "lucide-react";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Blog Editor",
    to: "/blog-editor",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Blog List",
    to: "/blog",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Social Media Calendar",
    to: "/calendar",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    title: "Case Studies",
    to: "/case-studies",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Job Applications",
    to: "/job-applications",
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    title: "Vendor Directory",
    to: "/vendor-directory",
    icon: <Building className="h-4 w-4" />,
  },
  {
    title: "Events Calendar",
    to: "/events",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    title: "Agent Dashboard",
    to: "/agents",
    icon: <Bot className="h-4 w-4" />,
  },
  {
    title: "Prompt Library",
    to: "/prompt-library",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    title: "Auth",
    to: "/auth",
    icon: <LogIn className="h-4 w-4" />,
  },
];
