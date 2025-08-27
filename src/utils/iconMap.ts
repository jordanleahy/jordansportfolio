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
  AlertCircle
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
  AlertCircle
} as const;

export type IconName = keyof typeof iconMap;