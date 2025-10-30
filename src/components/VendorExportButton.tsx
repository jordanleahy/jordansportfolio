import { Button } from "@/components/ui/button";
import { useVendors } from "@/hooks/useVendors";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const VendorExportButton = () => {
  const { data: vendors, isLoading } = useVendors();
  const { toast } = useToast();

  const handleExport = () => {
    if (!vendors || vendors.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no vendors to export.",
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      total_count: vendors.length,
      vendors: vendors,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vendors-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${vendors.length} vendors to JSON file.`,
    });
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isLoading ? "Loading..." : "Export All Vendors"}
    </Button>
  );
};
