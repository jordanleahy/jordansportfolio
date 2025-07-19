interface VendorSchema {
  company_name: string;
  slug: string;
  headquarters: string;
  founding_year?: number | null;
  company_type: string;
  description: string;
  core_services: string[];
  specialties: string[];
  customers: string[];
  key_features: string[];
  key_benefits: string[];
  website_url?: string | null;
  source_url?: string | null;
  funding_stage?: string | null;
  total_funding?: string | null;
  key_investors: string[];
  competitive_advantages: string[];
  performance_metrics?: Record<string, any> | null;
  notable_customers: string[];
  research_data?: Record<string, any> | null;
  company_data?: Record<string, any> | null;
  status?: string;
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  cleanedData: Partial<VendorSchema>;
}

export const validateVendorData = (rawData: any): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const cleanedData: any = {};

  // Required fields validation
  const requiredFields = ['company_name', 'slug', 'headquarters', 'company_type', 'description'];
  
  for (const field of requiredFields) {
    if (!rawData[field] || typeof rawData[field] !== 'string' || rawData[field].trim() === '') {
      errors.push({
        field,
        message: `${field} is required and must be a non-empty string`,
        severity: 'error'
      });
    } else {
      cleanedData[field as keyof VendorSchema] = rawData[field].trim();
    }
  }

  // Type validations
  if (rawData.founding_year !== undefined && rawData.founding_year !== null) {
    const year = Number(rawData.founding_year);
    if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 5) {
      errors.push({
        field: 'founding_year',
        message: 'founding_year must be a valid year between 1800 and current year + 5',
        severity: 'error'
      });
    } else {
      cleanedData.founding_year = year;
    }
  }

  // Array field validations
  const arrayFields = ['core_services', 'specialties', 'customers', 'key_features', 'key_benefits', 'key_investors', 'competitive_advantages', 'notable_customers'];
  
  for (const field of arrayFields) {
    if (rawData[field] !== undefined) {
      if (!Array.isArray(rawData[field])) {
        errors.push({
          field,
          message: `${field} must be an array`,
          severity: 'error'
        });
      } else {
        const cleanArray = rawData[field].filter((item: any) => 
          typeof item === 'string' && item.trim() !== ''
        ).map((item: string) => item.trim());
        
        cleanedData[field as keyof VendorSchema] = cleanArray;
        
        if (cleanArray.length === 0 && rawData[field].length > 0) {
          warnings.push({
            field,
            message: `${field} had invalid items that were removed`,
            severity: 'warning'
          });
        }
      }
    } else {
      cleanedData[field as keyof VendorSchema] = [];
    }
  }

  // URL validations
  const urlFields = ['website_url', 'source_url'];
  for (const field of urlFields) {
    if (rawData[field]) {
      try {
        new URL(rawData[field]);
        cleanedData[field as keyof VendorSchema] = rawData[field];
      } catch {
        warnings.push({
          field,
          message: `${field} is not a valid URL format`,
          severity: 'warning'
        });
        cleanedData[field as keyof VendorSchema] = rawData[field]; // Keep it anyway
      }
    }
  }

  // Object field validations
  const objectFields = ['performance_metrics', 'research_data', 'company_data'];
  for (const field of objectFields) {
    if (rawData[field] !== undefined) {
      if (typeof rawData[field] === 'object' && rawData[field] !== null) {
        cleanedData[field as keyof VendorSchema] = rawData[field];
      } else {
        warnings.push({
          field,
          message: `${field} should be an object, setting to empty object`,
          severity: 'warning'
        });
        cleanedData[field as keyof VendorSchema] = {};
      }
    } else {
      cleanedData[field as keyof VendorSchema] = {};
    }
  }

  // Status validation
  const validStatuses = ['draft', 'completed', 'published'];
  if (rawData.status && !validStatuses.includes(rawData.status)) {
    warnings.push({
      field: 'status',
      message: `Invalid status "${rawData.status}", defaulting to "draft"`,
      severity: 'warning'
    });
    cleanedData.status = 'draft';
  } else {
    cleanedData.status = rawData.status || 'draft';
  }

  // String field validations
  const stringFields = ['funding_stage', 'total_funding'];
  for (const field of stringFields) {
    if (rawData[field] !== undefined && rawData[field] !== null) {
      if (typeof rawData[field] === 'string') {
        cleanedData[field as keyof VendorSchema] = rawData[field].trim();
      } else {
        warnings.push({
          field,
          message: `${field} should be a string, converting from ${typeof rawData[field]}`,
          severity: 'warning'
        });
        cleanedData[field as keyof VendorSchema] = String(rawData[field]);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleanedData
  };
};

export const formatValidationErrors = (result: ValidationResult): string => {
  let message = '';
  
  if (result.errors.length > 0) {
    message += '❌ Errors:\n';
    result.errors.forEach(error => {
      message += `• ${error.field}: ${error.message}\n`;
    });
  }
  
  if (result.warnings.length > 0) {
    message += '\n⚠️ Warnings:\n';
    result.warnings.forEach(warning => {
      message += `• ${warning.field}: ${warning.message}\n`;
    });
  }
  
  return message;
};