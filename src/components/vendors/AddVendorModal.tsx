import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VENDOR_CATEGORIES } from "@/types/vendor";

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded: () => void;
}

export const AddVendorModal = ({ isOpen, onClose, onVendorAdded }: AddVendorModalProps) => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a website URL.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Error", 
        description: "Please select a category.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Extract company name from URL (simple fallback)
      const urlObj = new URL(websiteUrl);
      const domain = urlObj.hostname.replace('www.', '');
      const companyName = domain.split('.')[0];
      
      // Generate slug from company name
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Create basic vendor record
      const insertData = {
        company_name: companyName.charAt(0).toUpperCase() + companyName.slice(1),
        slug: slug,
        website_url: websiteUrl,
        source_url: websiteUrl,
        status: 'draft',
        company_type: '',
        description: '',
        headquarters: '',
        core_services: [],
        specialties: [],
        customers: [],
        key_features: [],
        key_benefits: [],
        key_investors: [],
        competitive_advantages: [],
        notable_customers: [],
        performance_metrics: {},
        research_data: {},
        company_data: {},
        user_id: user.id,
      };

      const { error } = await supabase
        .from('vendors')
        .insert(insertData);

      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Vendor has been added successfully!`,
      });

      onVendorAdded();
      handleClose();
    } catch (error) {
      console.error("Error inserting vendor:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add vendor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setWebsiteUrl("");
    setCategory("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              type="url"
              placeholder="https://company.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VENDOR_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Vendor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};