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
  Layers,
  Search,
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
  Layers,
  Search,
  Zap
} as const;

export type IconName = keyof typeof iconMap;