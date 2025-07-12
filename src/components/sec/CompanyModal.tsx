import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  MapPin, 
  User, 
  ExternalLink, 
  Copy, 
  Check,
  Mail,
  Phone
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CompanyModalProps {
  company: any;
  onClose: () => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({ company, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState("");

  React.useEffect(() => {
    if (company) {
      const template = generateEmailTemplate(company);
      setEmailTemplate(template);
    }
  }, [company]);

  const generateEmailTemplate = (company: any) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(company.amountRaised);

    const formattedDate = new Date(company.dateOfFirstSale).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `Subject: Congratulations on your recent ${formattedAmount} raise

Hi ${company.founder || 'there'},

I came across your recent SEC filing showing your ${formattedAmount} raise on ${formattedDate}. Congratulations on this significant milestone!

I'm reaching out because [your reason for connecting - partnership opportunity, investment interest, service offering, etc.].

Would you be open to a brief conversation about [specific value proposition]?

Best regards,
[Your Name]
[Your Title]
[Your Company]
[Your Contact Information]`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(emailTemplate);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Email template has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Mock related persons data
  const relatedPersons = [
    { name: company?.founder || "John Doe", title: "CEO & Founder", type: "Executive" },
    { name: "Jane Smith", title: "CTO", type: "Executive" },
    { name: "Robert Johnson", title: "CFO", type: "Executive" }
  ];

  if (!company) return null;

  return (
    <Dialog open={!!company} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {company.companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 mt-4">
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Offering Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount Raised</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(company.amountRaised)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of First Sale</p>
                  <p className="text-lg font-semibold">{formatDate(company.dateOfFirstSale)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Industry</p>
                  <Badge variant="secondary" className="mt-1">{company.industry}</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="default" className="mt-1">{company.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {company.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Form D Filing</p>
                  <Button variant="outline" size="sm" className="mt-1">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View SEC Filing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Personnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Key Personnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {relatedPersons.map((person, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-sm text-muted-foreground">{person.title}</p>
                    </div>
                    <Badge variant="outline">{person.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Company Address</p>
                <p className="text-sm">
                  123 Business Ave<br />
                  Suite 100<br />
                  {company.location}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Contact Details</p>
                <div className="space-y-1">
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    (555) 123-4567
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    contact@{company.companyName.toLowerCase().replace(/\s+/g, '')}.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Template
                </span>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder="Email template will be generated here..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                You can edit this template before copying it to your clipboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};