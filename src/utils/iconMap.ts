import { 
  Eye, 
  Lightbulb, 
  Target, 
  CheckCircle, 
  Users, 
  Brain, 
  FileText, 
  TrendingUp, 
  Clock, 
  Shield,
  BarChart3,
  Activity,
  AlertCircle,
  Smartphone,
  Layout,
  BarChart,
  Settings,
  Zap
} from "lucide-react";

export const iconMap = {
  Eye,
  Lightbulb,
  Target,
  CheckCircle,
  Users,
  Brain,
  FileText,
  TrendingUp,
  Clock,
  Shield,
  BarChart3,
  Activity,
  AlertCircle,
  Smartphone,
  Layout,
  BarChart,
  Settings,
  Zap
} as const;

export type IconName = keyof typeof iconMap;