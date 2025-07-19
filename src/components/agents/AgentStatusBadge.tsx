import { Badge } from "@/components/ui/badge";
import { AgentStatus } from "@/types/openaiAgent";

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

export const AgentStatusBadge = ({ status }: AgentStatusBadgeProps) => {
  const getStatusConfig = (status: AgentStatus) => {
    switch (status) {
      case 'active':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          label: 'Active'
        };
      case 'paused':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          label: 'Paused'
        };
      case 'deprecated':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-200',
          label: 'Deprecated'
        };
      default:
        return {
          variant: 'outline' as const,
          className: '',
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};