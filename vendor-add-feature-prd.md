# Product Requirements Document (PRD)
## AI-Assisted Vendor Addition Feature

---

## 1. Executive Summary

### Feature Overview
An intelligent vendor management system that allows administrators to add new vendor/company profiles to a database using a two-step AI-assisted research workflow. The system generates AI research prompts, accepts structured JSON responses, and automatically creates vendor database records.

### Business Value
- **Efficiency**: Reduces vendor data entry time from hours to minutes
- **Accuracy**: Structured AI prompts ensure consistent, comprehensive vendor profiles
- **Scalability**: Enables rapid competitive intelligence database growth
- **Quality**: Standardized data extraction ensures high-quality vendor profiles

---

## 2. End-to-End Workflow

### Phase 1: Manual Data Entry (Current Modal)
```
User Opens Modal
    ↓
Enters Website URL → Optional: Click Lightbulb Icon to Generate AI Prompt
    ↓                         ↓
Selects Category        Copy Prompt & Use with ChatGPT/Claude
    ↓                         ↓
Click "Add Vendor"      Paste JSON Response Elsewhere (Manual Process)
    ↓
System Validates Input
    ↓
Creates Basic Vendor Record in Database
    ↓
Success Toast & Refresh
```

### Phase 2: Suggested Enhancement (AI Integration)
```
User Opens Modal
    ↓
Enters Website URL + Category
    ↓
Click "AI Research" Button
    ↓
System Sends Prompt to AI API (ChatGPT/Claude)
    ↓
AI Returns Structured JSON
    ↓
System Validates JSON Schema
    ↓
Preview Screen Shows Extracted Data
    ↓
User Reviews & Confirms
    ↓
System Creates Complete Vendor Record
    ↓
Success Toast & Refresh
```

---

## 3. Feature Components

### 3.1 User Interface Components

#### Add Vendor Modal
- **Trigger**: "Add Vendor" button (admin view only)
- **Fields**:
  - Website URL (text input, required)
  - Category (dropdown select, required)
- **Actions**:
  - Lightbulb icon button → Generates AI research prompt
  - Cancel button → Closes modal, resets form
  - Add Vendor button → Submits data

#### Prompt Generation Modal
- **Display**: Full-screen modal with scrollable textarea
- **Content**: Pre-generated AI research prompt (4000+ characters)
- **Actions**:
  - Copy Prompt button → Copies to clipboard
  - Back button → Returns to main form

### 3.2 Categories
Pre-defined vendor categories from VENDOR_CATEGORIES constant:

1. **RCM** - Revenue Cycle Management Companies
2. **Healthcare** - Healthcare Technology Companies
3. **Fintech** - Financial Technology Companies
4. **SaaS** - Software as a Service Companies
5. **AI** - Artificial Intelligence Companies
6. **Cybersecurity** - Cybersecurity Companies
7. **EdTech** - Education Technology Companies
8. **HRTech** - Human Resources Technology Companies

---

## 4. Database Schema

### Table: `vendors`

#### Core Fields
```typescript
{
  id: uuid (auto-generated)
  user_id: uuid (FK to auth.users)
  created_at: timestamp
  updated_at: timestamp
  status: string ('draft' | 'published')
  slug: string (unique, URL-friendly)
}
```

#### Company Information
```typescript
{
  company_name: string (required)
  headquarters: string
  founding_year: number | null
  company_type: string
  description: text
  website_url: string (unique)
  source_url: string
}
```

#### Business Details
```typescript
{
  core_services: string[]
  specialties: string[]
  customers: string[]
  key_features: string[]
  key_benefits: string[]
  business_model: string | null
  employee_count_range: string | null
  geographic_presence: string | null
}
```

#### Financial Information
```typescript
{
  funding_stage: string | null
  total_funding: string | null
  key_investors: string[]
}
```

#### Competitive Intelligence
```typescript
{
  competitive_advantages: string[]
  competitors: string[]
  notable_customers: string[]
  performance_metrics: jsonb
}
```

#### Contact & Social
```typescript
{
  contact_email: string | null
  contact_phone: string | null
  contact_address: string | null
  linkedin_url: string | null
  twitter_url: string | null
}
```

#### Additional Data
```typescript
{
  certifications: string[]
  awards_recognition: string[]
  office_locations: string[]
  partnerships: string[]
  tech_stack: string[]
  research_data: jsonb
  company_data: jsonb
  vendor_images: jsonb
}
```

#### SEO Fields
```typescript
{
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
}
```

---

## 5. Technical Implementation

### 5.1 Frontend (React + TypeScript)

#### Component Structure
```
AddVendorModal/
├── State Management
│   ├── websiteUrl (string)
│   ├── category (string)
│   ├── isSubmitting (boolean)
│   ├── showPrompt (boolean)
│   └── generatedPrompt (string)
├── Functions
│   ├── generateAdvancedPrompt() - Creates AI research prompt
│   ├── copyPrompt() - Copies prompt to clipboard
│   ├── handleSubmit() - Creates vendor record
│   └── handleClose() - Resets and closes modal
└── UI Components
    ├── Main Form Modal
    └── Prompt Display Modal
```

#### Key Libraries
- **UI**: Radix UI (Dialog, Button, Input, Select)
- **Database**: Supabase Client
- **Notifications**: Sonner Toast
- **Icons**: Lucide React

### 5.2 Backend (Supabase)

#### Database Operations
```typescript
// 1. Check for existing vendor
SELECT company_name, website_url, slug 
FROM vendors 
WHERE slug = :slug 
LIMIT 1;

// 2. Insert new vendor
INSERT INTO vendors (
  company_name, slug, website_url, source_url,
  status, company_type, description, headquarters,
  user_id, [all other fields...]
) VALUES (...);
```

#### Row Level Security (RLS)
```sql
-- Users can create vendors (authenticated)
CREATE POLICY "Users can insert vendors"
ON vendors FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin users can view all vendors
CREATE POLICY "Admin can view all vendors"
ON vendors FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

---

## 6. Data Processing Logic

### 6.1 URL Normalization
```javascript
// Step 1: Trim whitespace
let url = websiteUrl.trim();

// Step 2: Add protocol if missing
if (!url.startsWith('http://') && !url.startsWith('https://')) {
  url = 'https://' + url;
}

// Step 3: Extract domain
const urlObj = new URL(url);
const domain = urlObj.hostname.replace('www.', '');

// Step 4: Extract company name
const companyName = domain.split('.')[0];
```

### 6.2 Slug Generation
```javascript
const slug = companyName
  .toLowerCase()                    // lowercase
  .replace(/[^a-z0-9\s-]/g, '')    // remove special chars
  .replace(/\s+/g, '-')            // spaces to hyphens
  .replace(/-+/g, '-')             // collapse multiple hyphens
  .replace(/^-|-$/g, '');          // trim leading/trailing hyphens
```

### 6.3 Duplicate Detection
1. Query database for existing vendor with same `slug`
2. If found, show error: "Vendor Already Exists"
3. If not found, proceed with insertion
4. Handle database constraint errors (23505 code)

---

## 7. AI Research Prompt Structure

### Prompt Components

#### 1. Mission Statement
- Target website URL
- Objective: Comprehensive vendor profile
- Output format: RAW JSON (no markdown)

#### 2. Research Instructions
- Visit multiple pages (about, products, pricing, press)
- Look for investor relations, case studies, testimonials
- Analyze leadership, timeline, competitive positioning
- Cross-reference for accuracy
- Focus on factual, verifiable information

#### 3. JSON Schema Definition
Complete database schema with:
- Field names
- Data types
- Example values
- Nullability rules

#### 4. Detailed Mapping Guide
For each field:
- Description
- Format/type
- Examples
- Guidance on what to extract

#### 5. Critical Output Requirements
- No markdown blocks or code fences
- Straight quotes only (not smart quotes)
- Correct data types (number vs string)
- Use null for unknown values
- Use empty arrays [] for unknown lists

#### 6. Fallback Protocols
What to do when information is unavailable:
- Use null for single values
- Use empty arrays for lists
- Be conservative - don't guess

#### 7. Quality Assurance Checklist
Pre-submission verification steps

---

## 8. User Flows

### 8.1 Basic Flow (Add Minimal Vendor)
1. Admin clicks "Add Vendor" button
2. Modal opens
3. User enters: `https://example.com`
4. User selects: "Healthcare"
5. User clicks "Add Vendor"
6. System:
   - Validates inputs
   - Normalizes URL to `https://example.com`
   - Generates slug: `example`
   - Checks for duplicates
   - Creates vendor record with defaults
   - Shows success toast
   - Refreshes vendor list
7. Modal closes

### 8.2 AI-Assisted Flow (Get Research Prompt)
1. Admin clicks "Add Vendor" button
2. Modal opens
3. User enters: `https://stripe.com`
4. User clicks lightbulb icon (💡)
5. System generates research prompt
6. Prompt modal displays
7. User clicks "Copy Prompt"
8. User opens ChatGPT/Claude
9. User pastes prompt
10. AI returns JSON response
11. User manually uses JSON to update vendor
    (Note: Currently manual, could be automated)

---

## 9. Validation Rules

### Client-Side Validation
- **Website URL**: Required, must not be empty after trim
- **Category**: Required, must be one of predefined categories
- **URL Format**: Auto-adds https:// if protocol missing

### Server-Side Validation
- **Authentication**: User must be authenticated
- **Slug Uniqueness**: Must not conflict with existing slugs
- **Website URL Uniqueness**: Must not conflict with existing URLs
- **User Authorization**: User ID must match authenticated user

### Error Handling
```typescript
// Database Errors
23505: Unique constraint violation
  → vendors_slug_key: "Duplicate Vendor"
  → vendors_website_url_key: "Website Already Registered"

// Network Errors
TypeError (fetch): "Connection Error"

// Auth Errors
No user: "User not authenticated"

// Input Errors
Empty URL: "Please enter a website URL"
No category: "Please select a category"
```

---

## 10. State Management

### Modal States
1. **Closed** - Initial state, modal hidden
2. **Main Form** - Display URL input and category select
3. **Prompt View** - Display generated AI prompt
4. **Submitting** - Processing vendor creation
5. **Success** - Vendor created, closing modal
6. **Error** - Display error message, remain open

### Form States
```typescript
interface FormState {
  websiteUrl: string;        // User input
  category: string;          // Selected category key
  isSubmitting: boolean;     // Disable buttons during save
  showPrompt: boolean;       // Toggle between views
  generatedPrompt: string;   // Full AI prompt text
}
```

---

## 11. Integration Points

### 11.1 Supabase Integration
```typescript
import { supabase } from "@/integrations/supabase/client";

// Auth check
const { data: { user } } = await supabase.auth.getUser();

// Query existing vendors
const { data } = await supabase
  .from('vendors')
  .select('company_name, website_url, slug')
  .eq('slug', slug)
  .maybeSingle();

// Insert new vendor
const { error } = await supabase
  .from('vendors')
  .insert(insertData);
```

### 11.2 Toast Notifications
```typescript
import { useToast } from "@/hooks/use-toast";

// Success
toast({
  title: "Success",
  description: "Vendor has been added successfully!"
});

// Error
toast({
  title: "Error",
  description: "Please enter a website URL.",
  variant: "destructive"
});
```

---

## 12. Default Values

When creating a minimal vendor record:

```typescript
{
  company_name: "Example",           // Capitalized domain name
  slug: "example",                   // Generated from domain
  website_url: "https://example.com",
  source_url: "https://example.com",
  status: "draft",
  company_type: "Technology Company",
  description: "Example is a technology company providing innovative solutions.",
  headquarters: "Unknown",
  
  // Empty arrays for lists
  core_services: [],
  specialties: [],
  customers: [],
  key_features: [],
  key_benefits: [],
  key_investors: [],
  competitive_advantages: [],
  notable_customers: [],
  certifications: [],
  awards_recognition: [],
  office_locations: [],
  partnerships: [],
  tech_stack: [],
  
  // Empty objects for structured data
  performance_metrics: {},
  research_data: {},
  company_data: {},
  
  // Null for optional single values
  business_model: null,
  employee_count_range: null,
  geographic_presence: null,
  contact_email: null,
  contact_phone: null,
  contact_address: null,
  linkedin_url: null,
  twitter_url: null,
  
  user_id: "[current_user_id]"
}
```

---

## 13. Future Enhancements

### Phase 2: Direct AI Integration
- Add "AI Research" button to modal
- Integrate OpenAI or Anthropic API
- Automatically send prompt and receive JSON
- Display preview of extracted data
- Allow user to edit before saving

### Phase 3: Bulk Import
- CSV/Excel upload functionality
- Batch AI research for multiple URLs
- Queue system for processing
- Progress tracking

### Phase 4: Data Enrichment
- Automatic logo fetching
- LinkedIn company data integration
- Crunchbase API integration
- Real-time website screenshot generation

### Phase 5: Competitive Intelligence
- Automated competitor detection
- Market positioning analysis
- Funding round tracking
- News monitoring integration

---

## 14. Success Metrics

### User Efficiency
- Time to add vendor: < 30 seconds (manual)
- Time to add vendor with AI: < 2 minutes (AI-assisted)
- Duplicate detection rate: 100%

### Data Quality
- Complete profiles: 80%+ of vendors
- Accurate information: 95%+ accuracy
- Consistent formatting: 100%

### System Performance
- Modal load time: < 100ms
- Database insert time: < 500ms
- Prompt generation: Instant

---

## 15. Security Considerations

### Authentication
- Only authenticated users can add vendors
- User ID attached to all vendor records
- Admin-only feature (enforced at UI level)

### Data Validation
- URL sanitization to prevent XSS
- SQL injection prevented by parameterized queries
- Input length limits on all fields

### Database Security
- Row Level Security (RLS) policies enforced
- Unique constraints prevent duplicates
- Foreign key relationships maintained

---

## 16. Testing Scenarios

### Happy Path
1. ✅ Add vendor with valid URL and category
2. ✅ Generate and copy AI prompt
3. ✅ Add vendor with domain name only (auto-add https)

### Error Scenarios
1. ✅ Submit without URL → Show error
2. ✅ Submit without category → Show error
3. ✅ Submit duplicate domain → Show error
4. ✅ Network failure → Show connection error
5. ✅ Invalid URL format → Show validation error

### Edge Cases
1. ✅ URL with www. → Strip www.
2. ✅ URL with http:// → Accept as-is
3. ✅ URL with subdomains → Extract main domain
4. ✅ Very long company names → Truncate slug
5. ✅ Special characters in domain → Sanitize slug

---

## 17. Implementation Checklist

### Frontend
- [ ] Create modal component with form
- [ ] Add URL input with validation
- [ ] Add category dropdown
- [ ] Implement prompt generation logic
- [ ] Create prompt display modal
- [ ] Add copy-to-clipboard functionality
- [ ] Implement form submission
- [ ] Add loading states
- [ ] Add error handling
- [ ] Integrate toast notifications

### Backend
- [ ] Create vendors table schema
- [ ] Set up RLS policies
- [ ] Add unique constraints (slug, website_url)
- [ ] Create indexes for performance
- [ ] Set up foreign key relationships
- [ ] Implement duplicate detection query

### Integration
- [ ] Connect Supabase client
- [ ] Set up authentication check
- [ ] Implement database queries
- [ ] Add refresh mechanism after add

### Testing
- [ ] Unit tests for URL normalization
- [ ] Unit tests for slug generation
- [ ] Integration tests for database operations
- [ ] E2E tests for user flows
- [ ] Error handling tests

---

## 18. Dependencies

### Required Packages
```json
{
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-select": "^2.1.1",
  "@supabase/supabase-js": "^2.53.0",
  "lucide-react": "^0.462.0",
  "sonner": "^1.5.0",
  "react": "^18.3.1"
}
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 19. Code Structure

### File Organization
```
src/
├── components/
│   └── vendors/
│       ├── AddVendorModal.tsx        (Main component)
│       ├── VendorCardGrid.tsx        (Display vendors)
│       └── VendorExportButton.tsx    (Export functionality)
├── types/
│   └── vendor.ts                      (TypeScript interfaces)
├── hooks/
│   ├── useVendors.ts                 (Data fetching)
│   └── use-toast.ts                  (Notifications)
├── integrations/
│   └── supabase/
│       ├── client.ts                 (Supabase config)
│       └── types.ts                  (Generated types)
└── pages/
    └── VendorsIndex.tsx              (Main page)
```

---

## 20. API Reference

### AddVendorModal Props
```typescript
interface AddVendorModalProps {
  isOpen: boolean;              // Controls modal visibility
  onClose: () => void;          // Callback when modal closes
  onVendorAdded: () => void;    // Callback after successful add
  secAccessionnumber?: string;  // Optional SEC filing reference
}
```

### VENDOR_CATEGORIES
```typescript
export const VENDOR_CATEGORIES = {
  rcm: {
    title: 'Revenue Cycle Management (RCM) Companies',
    description: 'Comprehensive analysis of RCM vendors...'
  },
  healthcare: { ... },
  fintech: { ... },
  // ... 8 total categories
} as const;
```

---

## 21. Accessibility

### Keyboard Navigation
- Tab through form fields
- Enter to submit
- Escape to close modal

### Screen Readers
- Proper ARIA labels on all inputs
- Dialog role for modal
- Descriptive button text

### Visual Design
- High contrast colors
- Focus indicators
- Clear error messages
- Loading states

---

## 22. Browser Compatibility

### Minimum Requirements
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Features Used
- ES6+ JavaScript
- Fetch API
- Clipboard API
- CSS Grid/Flexbox

---

## 23. Deployment Considerations

### Environment Setup
1. Supabase project created
2. Database tables migrated
3. RLS policies enabled
4. Environment variables configured

### Build Process
1. TypeScript compilation
2. Vite bundling
3. Environment variable injection
4. Static asset optimization

---

## 24. Support & Documentation

### User Guide
- Admin documentation on adding vendors
- AI prompt usage guide
- Troubleshooting common errors

### Developer Guide
- Component API documentation
- Database schema documentation
- Integration examples
- Testing guidelines

---

## 25. Contact & Support

For implementation questions or support:
- Review this PRD thoroughly
- Check the existing codebase at `src/components/vendors/AddVendorModal.tsx`
- Refer to Supabase documentation for database setup
- Use the AI prompt template for consistent data extraction

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**Status**: Production-Ready  
**Target Implementation Time**: 2-3 days for experienced developer
