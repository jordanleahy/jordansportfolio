# Vendor Data Export Guide

## Method 1: Export via Supabase Query (Recommended)

Use this SQL query to get all vendor data:

```sql
SELECT * FROM vendors ORDER BY company_name;
```

## Method 2: Export from Application

Use the existing `useVendors` hook to fetch and export data:

```typescript
import { useVendors } from "@/hooks/useVendors";

// In your component:
const { data: vendors } = useVendors();

// Export to JSON
const exportVendors = () => {
  const jsonData = JSON.stringify(vendors, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vendors-export.json';
  link.click();
};
```

## Method 3: Direct API Call

```javascript
import { supabase } from "@/integrations/supabase/client";

const exportAllVendors = async () => {
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("company_name");
  
  if (error) throw error;
  
  // Save to file or send to AI
  return data;
};
```

## Vendor Data Structure

Each vendor record includes:

### Core Fields
- `id`, `slug`, `user_id`, `created_at`, `updated_at`
- `company_name`, `headquarters`, `founding_year`, `company_type`
- `description`, `status`, `website_url`, `source_url`

### Business Information
- `business_model`, `employee_count_range`, `geographic_presence`
- `core_services[]`, `specialties[]`, `key_features[]`, `key_benefits[]`
- `customers[]`, `notable_customers[]`

### Financial Data
- `funding_stage`, `total_funding`
- `key_investors[]`

### Competitive Intelligence
- `competitive_advantages[]`
- `competitors[]`
- `performance_metrics` (JSONB)

### Contact & Social
- `contact_email`, `contact_phone`, `contact_address`
- `linkedin_url`, `twitter_url`

### Additional Data
- `certifications[]`, `awards_recognition[]`
- `office_locations[]`, `partnerships[]`, `tech_stack[]`
- `vendor_images` (JSONB for image metadata)
- `research_data`, `company_data` (JSONB)

### SEO Fields
- `og_title`, `og_description`, `og_image_url`

## For AI Import

**Recommended format for providing to AI:**

```json
{
  "vendors": [
    {
      "company_name": "Example Corp",
      "headquarters": "San Francisco, CA",
      "description": "...",
      "core_services": ["Service 1", "Service 2"],
      ...
    }
  ],
  "schema": {
    "table_name": "vendors",
    "fields": { /* field definitions */ }
  }
}
```

## Quick Export Script

Create a page component to export all data:

```typescript
const ExportVendorsPage = () => {
  const { data: vendors, isLoading } = useVendors();
  
  const handleExport = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_count: vendors?.length || 0,
      vendors: vendors || []
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendors-export-${Date.now()}.json`;
    link.click();
  };
  
  return (
    <Button onClick={handleExport} disabled={isLoading}>
      Export All Vendors
    </Button>
  );
};
```
