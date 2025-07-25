import { Activity, Zap, Brain, Shield, FileText, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface FeaturedAgent {
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
  status: string;
  tags: string[];
  category?: 'clinical' | 'analytics' | 'workflow' | 'research';
}

export const FEATURED_AGENTS: FeaturedAgent[] = [
  {
    name: 'SIRS Diagnostic Agent',
    description: 'Rules-based clinical agent for Systemic Inflammatory Response Syndrome diagnosis',
    icon: Activity,
    path: '/agents/sirs-diagnostic',
    status: 'Clinical Ready',
    tags: ['Clinical', 'Diagnostic', 'SIRS'],
    category: 'clinical'
  },
  {
    name: 'Sepsis Agent',
    description: 'AI-powered sepsis detection and management system',
    icon: Zap,
    path: '/agents/sepsis',
    status: 'Available',
    tags: ['Clinical', 'Sepsis', 'Management'],
    category: 'clinical'
  },
  // Additional featured agents can be added here
  {
    name: 'Clinical Documentation Agent',
    description: 'Automated review and optimization of clinical documentation for accuracy',
    icon: FileText,
    path: '/agents/clinical-documentation',
    status: 'Coming Soon',
    tags: ['Documentation', 'CDI', 'Quality'],
    category: 'workflow'
  },
  {
    name: 'Risk Analytics Agent',
    description: 'Real-time patient risk assessment and predictive analytics',
    icon: BarChart3,
    path: '/agents/risk-analytics', 
    status: 'Beta',
    tags: ['Analytics', 'Risk', 'Prediction'],
    category: 'analytics'
  }
];

// Filter functions for different agent categories
export const getFeaturedAgentsByCategory = (category: FeaturedAgent['category']) => {
  return FEATURED_AGENTS.filter(agent => agent.category === category);
};

export const getActiveFeaturedAgents = () => {
  return FEATURED_AGENTS.filter(agent => 
    agent.status === 'Available' || 
    agent.status === 'Clinical Ready' || 
    agent.status === 'Beta'
  );
};

export const getClinicalAgents = () => {
  return getFeaturedAgentsByCategory('clinical');
};