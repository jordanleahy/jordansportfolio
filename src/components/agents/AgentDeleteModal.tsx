import { OpenAIAgent } from '@/types/openaiAgent';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface AgentDeleteModalProps {
  agent: OpenAIAgent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const AgentDeleteModal = ({ agent, open, onOpenChange, onConfirm }: AgentDeleteModalProps) => {
  const isDangerous = agent.status === 'active' || agent.last_run;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Agent
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to permanently delete <strong>"{agent.name}"</strong>?
            </p>
            
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                  {agent.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Run:</span>
                <span className="text-sm">
                  {agent.last_run ? 'Recently active' : 'Never run'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Model:</span>
                <span className="text-sm font-mono">{agent.model_version}</span>
              </div>
            </div>

            {isDangerous && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <p className="text-sm text-destructive font-medium mb-1">⚠️ Warning</p>
                <p className="text-sm text-destructive">
                  This agent is currently active or has been recently used. Deleting it may impact any automated workflows or integrations that depend on it.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All agent configuration, history, and associated data will be permanently removed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Agent
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};