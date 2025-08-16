import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { InvestorsTableView } from "@/components/investors/InvestorsTableView";
import { InvestorResearchModal } from "@/components/investors/InvestorResearchModal";
import type { Investor } from "@/types/investor";

const Investors = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);

  // Fetch investors query
  const { data: investors = [], isLoading } = useQuery({
    queryKey: ['investors', user?.id],
    queryFn: async () => {
      console.log('Fetching investors for user:', user?.id);
      
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching investors:', error);
        throw error;
      }

      console.log('Fetched investors:', data);
      return data as Investor[];
    },
    enabled: !!user?.id,
  });

  // Delete investor mutation
  const deleteInvestorMutation = useMutation({
    mutationFn: async (investorId: string) => {
      const { error } = await supabase
        .from('investors')
        .delete()
        .eq('id', investorId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast({
        title: "Success",
        description: "Investor deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting investor:', error);
      toast({
        title: "Error",
        description: "Failed to delete investor",
        variant: "destructive",
      });
    },
  });

  const handleDeleteInvestor = (investor: Investor) => {
    if (window.confirm(`Are you sure you want to delete ${investor.company_name}?`)) {
      deleteInvestorMutation.mutate(investor.id);
    }
  };

  const handleInvestorClick = (investor: Investor) => {
    // Navigate to investor detail page or open modal
    console.log('Investor clicked:', investor);
  };

  const handleInvestorsAdded = (count: number) => {
    queryClient.invalidateQueries({ queryKey: ['investors'] });
    toast({
      title: "Success",
      description: `Successfully added ${count} investor(s)`,
    });
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Please sign in to view investors.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Investors</h1>
            <p className="text-muted-foreground mt-2">
              Manage your investor database and research
            </p>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <Button 
                onClick={() => setIsResearchModalOpen(true)}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Generate Research
              </Button>
            )}
            
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Investor
            </Button>
          </div>
        </div>

        <InvestorsTableView
          investors={investors}
          onInvestorClick={handleInvestorClick}
          onDeleteClick={handleDeleteInvestor}
        />

        {isAdmin && (
          <InvestorResearchModal
            isOpen={isResearchModalOpen}
            onClose={() => setIsResearchModalOpen(false)}
            onInvestorsAdded={handleInvestorsAdded}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default Investors;