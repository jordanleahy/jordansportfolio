import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/utils/imageUpload";

const initialCompanies = [
  { name: "Revenue Cycle Management", logo: "SD", logoUrl: "https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/images//Day%201%20What%20Is%20Clinical%20Documentation%20Integrity%20%20169.png" },
  { name: "Prior Authorization", logo: "DH", logoUrl: "/lovable-uploads/4380ae80-9e2b-46a2-adbf-63b2cae372e3.png" },
  { name: "Pharma Innovation", logo: "RC", logoUrl: "/lovable-uploads/d16887ac-0992-4a5a-84f5-043c66a1acd3.png" },
  { name: "Claims Intelligence", logo: "MI", logoUrl: "/lovable-uploads/2cc42ee2-452d-41c2-a353-4d948c656a4a.png" },
  { name: "Digital Health Agency", logo: "CO", logoUrl: "/lovable-uploads/9e1e9048-62fc-4392-91bd-a5a82b8d5e42.png" },
  
  
];

const CompaniesSection = () => {
  const [companies, setCompanies] = useState(initialCompanies);
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();

  const handleLogoUpload = async (companyName: string, file: File) => {
    try {
      const fileName = `${companyName.toLowerCase().replace(/\s+/g, '-')}`;
      
      const logoUrl = await uploadImage(file, {
        folder: 'company-logos',
        fileName
      });

      if (!logoUrl) {
        throw new Error('Upload failed');
      }

      setCompanies(prev => 
        prev.map(company => 
          company.name === companyName 
            ? { ...company, logoUrl }
            : company
        )
      );

      toast({
        title: "Logo uploaded successfully",
        description: `Logo for ${companyName} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (companyName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(companyName, file);
    }
  };

  const removeLogo = async (companyName: string) => {
    setCompanies(prev => 
      prev.map(company => 
        company.name === companyName 
          ? { ...company, logoUrl: undefined }
          : company
      )
    );
  };

  return (
    <section id="companies" className="py-24 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-foreground">Trusted by Leading Healthcare Companies</h2>
          <p className="text-muted-foreground text-lg">
            Delivering design excellence across the healthcare ecosystem
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center max-w-4xl mx-auto">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="group relative w-full"
            >
              <div className="bg-card border border-accent/20 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer w-full h-full">
                <div className="w-12 h-12 mx-auto mb-3 bg-accent/10 rounded-lg flex items-center justify-center text-accent font-bold text-sm overflow-hidden">
                  {(company as any).logoUrl ? (
                    <img 
                      src={(company as any).logoUrl} 
                      alt={`${company.name} logo`}
                      className="w-full h-full object-contain"
                      onLoad={() => console.log(`Logo loaded for ${company.name}:`, (company as any).logoUrl)}
                      onError={() => console.log(`Logo failed to load for ${company.name}:`, (company as any).logoUrl)}
                    />
                  ) : (
                    company.logo
                  )}
                </div>
                <p className="font-sans text-sm font-medium text-foreground/80 group-hover:text-accent transition-colors">
                  {company.name}
                </p>
                
                {editMode && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(company.name, e)}
                          className="hidden"
                        />
                        <div className="bg-white text-black p-2 rounded-full hover:bg-gray-100 transition-colors">
                          <Upload size={16} />
                        </div>
                      </label>
                      {(company as any).logoUrl && (
                        <button
                          onClick={() => removeLogo(company.name)}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompaniesSection;