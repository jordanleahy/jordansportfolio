interface VendorSchema {
  company_name?: string | null;
  headquarters?: string | null;
  founding_year?: number | null;
  company_type?: string | null;
  description?: string | null;
  core_services?: string[] | null;
  specialties?: string[] | null;
  customers?: string[] | null;
  key_features?: string[] | null;
  key_benefits?: string[] | null;
  website_url?: string | null;
  source_url?: string | null;
  funding_stage?: string | null;
  total_funding?: string | null;
  key_investors?: string[] | null;
  competitive_advantages?: string[] | null;
  performance_metrics?: Record<string, any> | null;
  notable_customers?: string[] | null;
  research_data?: Record<string, any> | null;
  company_data?: Record<string, any> | null;
  status?: string;
  // New extracted fields
  business_model?: string | null;
  employee_count_range?: string | null;
  geographic_presence?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_address?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  certifications?: string[] | null;
  awards_recognition?: string[] | null;
  office_locations?: string[] | null;
  partnerships?: string[] | null;
  tech_stack?: string[] | null;
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
  console.log("🔍 [VendorValidation] Starting validation process");
  console.log("📊 [VendorValidation] Raw data keys:", Object.keys(rawData || {}));
  console.log("📋 [VendorValidation] Raw data preview:", JSON.stringify(rawData).substring(0, 200) + "...");
  
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const cleanedData: any = {};

  // Only company_name is truly required now, others are nullable
  const requiredFields = ['company_name'];
  
  console.log("✅ [VendorValidation] Checking required fields:", requiredFields);
  
  for (const field of requiredFields) {
    if (!rawData[field] || typeof rawData[field] !== 'string' || rawData[field].trim() === '') {
      console.warn(`⚠️ [VendorValidation] Missing required field: ${field}`);
      errors.push({
        field,
        message: `${field} is required and must be a non-empty string`,
        severity: 'error'
      });
    } else {
      cleanedData[field as keyof VendorSchema] = rawData[field].trim();
      console.log(`✅ [VendorValidation] ${field} validated successfully`);
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

  // Array field validations - Added 'competitors' to the array
  const arrayFields = [
    'core_services', 'specialties', 'customers', 'key_features', 'key_benefits', 
    'key_investors', 'competitive_advantages', 'competitors', 'notable_customers',
    'certifications', 'awards_recognition', 'office_locations', 'partnerships', 'tech_stack'
  ];
  
  console.log("🔍 [VendorValidation] Processing array fields:", arrayFields);
  
  for (const field of arrayFields) {
    if (rawData[field] !== undefined) {
      console.log(`📋 [VendorValidation] Processing ${field}:`, rawData[field]);
      
      if (!Array.isArray(rawData[field])) {
        console.warn(`⚠️ [VendorValidation] ${field} is not an array, type:`, typeof rawData[field]);
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
        console.log(`✅ [VendorValidation] ${field} cleaned: ${cleanArray.length} items`);
        
        if (cleanArray.length === 0 && rawData[field].length > 0) {
          console.warn(`⚠️ [VendorValidation] ${field} had invalid items removed`);
          warnings.push({
            field,
            message: `${field} had invalid items that were removed`,
            severity: 'warning'
          });
        }
      }
    } else {
      cleanedData[field as keyof VendorSchema] = [];
      console.log(`📋 [VendorValidation] ${field} not provided, setting to empty array`);
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
  const stringFields = [
    'funding_stage', 'total_funding', 'business_model', 'employee_count_range',
    'geographic_presence', 'contact_email', 'contact_phone', 'contact_address',
    'linkedin_url', 'twitter_url'
  ];
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

  const isValid = errors.length === 0;
  console.log(`🎯 [VendorValidation] Validation complete - Valid: ${isValid}`);
  console.log(`📊 [VendorValidation] Summary - Errors: ${errors.length}, Warnings: ${warnings.length}`);
  console.log(`📋 [VendorValidation] Cleaned data fields: ${Object.keys(cleanedData).length}`);
  
  if (cleanedData.key_benefits || cleanedData.competitive_advantages || cleanedData.key_features) {
    console.log("🎯 [VendorValidation] Key arrays processed:", {
      key_benefits: cleanedData.key_benefits?.length || 0,
      competitive_advantages: cleanedData.competitive_advantages?.length || 0,
      key_features: cleanedData.key_features?.length || 0
    });
  }

  return {
    isValid,
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

// New function to calculate data completeness score for QA
export const calculateCompletenessScore = (data: any): number => {
  const totalFields = [
    'company_name', 'slug', 'headquarters', 'company_type', 'description',
    'founding_year', 'core_services', 'specialties', 'customers',
    'key_features', 'key_benefits', 'website_url', 'funding_stage',
    'total_funding', 'key_investors', 'competitive_advantages'
  ];
  
  let completedFields = 0;
  
  totalFields.forEach(field => {
    const value = data[field];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) completedFields++;
      } else {
        completedFields++;
      }
    }
  });
  
  return Math.round((completedFields / totalFields.length) * 100);
};

// Helper to identify potential data quality issues
export const identifyDataQualityIssues = (data: any): string[] => {
  const issues: string[] = [];
  
  // Check for generic or placeholder content
  const genericTerms = ['lorem', 'ipsum', 'placeholder', 'example', 'test', 'unknown'];
  const fieldsToCheck = ['company_name', 'description', 'headquarters'];
  
  fieldsToCheck.forEach(field => {
    const value = data[field]?.toLowerCase() || '';
    if (genericTerms.some(term => value.includes(term))) {
      issues.push(`${field} contains generic placeholder text`);
    }
  });
  
  // Check for unrealistic funding amounts
  if (data.total_funding && typeof data.total_funding === 'string') {
    const fundingMatch = data.total_funding.match(/\$([0-9,]+)([MBK])?/);
    if (fundingMatch) {
      const amount = parseInt(fundingMatch[1].replace(/,/g, ''));
      const suffix = fundingMatch[2];
      
      if (suffix === 'B' && amount > 50) {
        issues.push('Funding amount seems unrealistically high');
      }
    }
  }
  
  // Check for very short descriptions
  if (data.description && data.description.length < 50) {
    issues.push('Company description is very brief');
  }
  
  // Check for empty arrays that should have content
  const arrayFields = ['core_services', 'key_features', 'specialties'];
  arrayFields.forEach(field => {
    if (Array.isArray(data[field]) && data[field].length === 0) {
      issues.push(`${field} is empty but should contain relevant information`);
    }
  });
  
  return issues;
};
