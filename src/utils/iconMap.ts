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
  Settings,
  Images
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
  Settings,
  Images
} as const;

export type IconName = keyof typeof iconMap;