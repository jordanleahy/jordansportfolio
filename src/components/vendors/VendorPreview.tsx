import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, ExternalLink } from "lucide-react";
import { ValidationResult } from "@/utils/vendorValidation";

interface VendorPreviewProps {
  validationResult: ValidationResult;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const VendorPreview = ({ validationResult, onConfirm, onCancel, isProcessing }: VendorPreviewProps) => {
  const { isValid, errors, warnings, cleanedData } = validationResult;

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      <Card className={`border-2 ${isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isValid ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-800">Validation Passed</span>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-red-600" />
                <span className="text-red-800">Validation Failed</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.length > 0 && (
            <div>
              <h4 className="font-medium text-red-800 mb-2">❌ Errors that must be fixed:</h4>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="font-medium">{error.field}:</span>
                    <span>{error.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {warnings.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Warnings (will be auto-corrected):
              </h4>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                    <span className="font-medium">{warning.field}:</span>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isValid && errors.length === 0 && warnings.length === 0 && (
            <p className="text-green-700 text-sm">All data validated successfully! Ready to add vendor.</p>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      {isValid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor Data Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Company Name</h4>
                <p className="font-medium">{cleanedData.company_name}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Headquarters</h4>
                <p>{cleanedData.headquarters}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Type</h4>
                <Badge variant="secondary">{cleanedData.company_type}</Badge>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Founded</h4>
                <p>{cleanedData.founding_year || 'Unknown'}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
              <p className="text-sm">{cleanedData.description}</p>
            </div>

            {/* Services & Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Core Services</h4>
                <div className="flex flex-wrap gap-1">
                  {cleanedData.core_services?.map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">{service}</Badge>
                  )) || <span className="text-sm text-muted-foreground">None specified</span>}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Key Features</h4>
                <div className="flex flex-wrap gap-1">
                  {cleanedData.key_features?.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">{feature}</Badge>
                  )) || <span className="text-sm text-muted-foreground">None specified</span>}
                </div>
              </div>
            </div>

            {/* Funding Info */}
            {(cleanedData.funding_stage || cleanedData.total_funding) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Funding Stage</h4>
                  <p>{cleanedData.funding_stage || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Total Funding</h4>
                  <p>{cleanedData.total_funding || 'Not specified'}</p>
                </div>
              </div>
            )}

            {/* Website */}
            {cleanedData.website_url && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Website</h4>
                <a 
                  href={cleanedData.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  {cleanedData.website_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={onConfirm} 
          disabled={!isValid || isProcessing}
          className="flex-1"
        >
          {isProcessing ? "Adding Vendor..." : "Confirm & Add Vendor"}
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          Back to Edit
        </Button>
      </div>
    </div>
  );
};