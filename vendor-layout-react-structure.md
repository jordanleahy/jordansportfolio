# Vendor Profile Layout - React Component Structure

## Overview
This document outlines the component structure for the vendor profile layout that you can implement in another React application.

## Component Hierarchy

```
PublicVendorView (Main Page Component)
├── Helmet (SEO Meta Tags)
├── PageLayout (Base Layout Wrapper)
    └── Container (max-w-7xl mx-auto py-8 px-4)
        ├── Breadcrumb Navigation
        ├── Header Section
        │   ├── Company Name + Badge
        │   ├── Location & Founded Info
        │   └── Visit Website Button
        └── Main Grid (grid grid-cols-1 lg:grid-cols-3)
            ├── Left Column (lg:col-span-2)
            │   ├── Core Services Card
            │   ├── Specialties Card
            │   ├── Target Customers Card
            │   ├── Key Features Card
            │   ├── Key Benefits Card
            │   ├── Competitive Advantages Card
            │   ├── Two-Column Grid
            │   │   ├── Notable Customers Card
            │   │   ├── Competitors Card
            │   │   ├── Key Investors Card
            │   │   ├── Certifications Card
            │   │   ├── Awards Card
            │   │   └── Partnerships Card
            │   └── Image Gallery (conditional)
            └── Right Column (Sidebar)
                ├── Company Stats Card
                ├── Funding Information Card
                └── Contact Information Card
```

## Key Components to Implement

### 1. Card Component
```jsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className }: CardProps) => (
  <div className={`bg-white rounded-lg shadow ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 border-b border-gray-200">
    {children}
  </div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold flex items-center gap-2">
    {children}
  </h2>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4">
    {children}
  </div>
);
```

### 2. Badge Component
```jsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'startup' | 'private' | 'public' | 'subsidiary';
}

const Badge = ({ children, variant = 'private' }: BadgeProps) => {
  const variants = {
    startup: 'bg-green-100 text-green-800',
    private: 'bg-blue-100 text-blue-800',
    public: 'bg-yellow-100 text-yellow-800',
    subsidiary: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`px-3 py-1 rounded-md text-sm font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};
```

### 3. Array Field Renderer
```jsx
interface RenderArrayFieldProps {
  items: string[] | undefined;
  title: string;
  icon: React.ReactNode;
}

const renderArrayField = ({ items, title, icon }: RenderArrayFieldProps) => {
  if (!items || items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-3 text-sm leading-relaxed">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-600">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
```

### 4. Breadcrumb Component
```jsx
const Breadcrumb = ({ children }: { children: React.ReactNode }) => (
  <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
    {children}
  </nav>
);

const BreadcrumbItem = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center gap-2">{children}</span>
);

const BreadcrumbLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="hover:text-gray-900 transition-colors">
    {children}
  </a>
);

const BreadcrumbSeparator = () => (
  <span className="text-gray-400">/</span>
);
```

### 5. Main Layout Component
```jsx
interface VendorProfileProps {
  vendor: {
    company_name: string;
    company_type: string;
    headquarters: string;
    founding_year?: number;
    website_url?: string;
    description: string;
    core_services: string[];
    specialties: string[];
    customers: string[];
    key_features: string[];
    key_benefits: string[];
    competitive_advantages: string[];
    notable_customers: string[];
    competitors: string[];
    key_investors: string[];
    total_funding?: string;
    funding_stage?: string;
    employee_count_range?: string;
    business_model?: string;
    contact_email?: string;
    contact_phone?: string;
    linkedin_url?: string;
    twitter_url?: string;
  };
}

const VendorProfile = ({ vendor }: VendorProfileProps) => {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/vendors">Vendors</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>{vendor.company_name}</BreadcrumbItem>
      </Breadcrumb>

      {/* Header Section */}
      <div className="bg-white rounded-lg p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-4 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold">
                {vendor.company_name}
              </h1>
              <Badge variant={vendor.company_type.toLowerCase()}>
                {vendor.company_type}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-600">
              <span className="flex items-center gap-2">
                📍 {vendor.headquarters}
              </span>
              {vendor.founding_year && (
                <span className="flex items-center gap-2">
                  📅 Founded {vendor.founding_year}
                </span>
              )}
            </div>
          </div>
          {vendor.website_url && (
            <a
              href={vendor.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              🔗 Visit Website
            </a>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {renderArrayField({
            items: vendor.core_services,
            title: "Core Services",
            icon: "🎯"
          })}
          {renderArrayField({
            items: vendor.specialties,
            title: "Specialties",
            icon: "✨"
          })}
          {renderArrayField({
            items: vendor.customers,
            title: "Target Customers",
            icon: "👥"
          })}
          {renderArrayField({
            items: vendor.key_features,
            title: "Key Features",
            icon: "💡"
          })}
          {renderArrayField({
            items: vendor.key_benefits,
            title: "Key Benefits",
            icon: "💰"
          })}
        </div>

        {/* Right Column - Sidebar */}
        <aside className="space-y-6">
          {/* Company Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Company Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.founding_year && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Founded</span>
                  <span className="text-xl font-semibold">{vendor.founding_year}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600 block mb-1">Headquarters</span>
                <span className="font-medium">{vendor.headquarters}</span>
              </div>
            </CardContent>
          </Card>

          {/* Funding Card */}
          <Card>
            <CardHeader>
              <CardTitle>💰 Funding Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-600 block mb-1">Total Funding</span>
                <span className="text-xl font-semibold">
                  {vendor.total_funding || 'Not disclosed'}
                </span>
              </div>
              {vendor.funding_stage && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Funding Stage</span>
                  <span className="font-medium">{vendor.funding_stage}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default VendorProfile;
```

## Tailwind CSS Classes Reference

### Layout Classes
- **Container**: `container mx-auto py-8 px-4`
- **Grid**: `grid grid-cols-1 lg:grid-cols-3 gap-8`
- **Spacing**: `space-y-6`, `space-y-8`, `gap-4`, `gap-8`

### Typography Classes
- **Headings**: `text-3xl md:text-4xl font-bold`
- **Card Titles**: `text-lg font-semibold`
- **Body Text**: `text-sm text-gray-600`
- **Stats**: `text-xl font-semibold`

### Component Classes
- **Card**: `bg-white rounded-lg shadow`
- **Button**: `bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700`
- **Badge**: `px-3 py-1 rounded-md text-sm font-medium`
- **Bullet**: `w-1.5 h-1.5 bg-blue-600 rounded-full`

## Icons
Use any icon library (Lucide React, Heroicons, React Icons):
- Building/Location icon
- Calendar icon
- External Link icon
- Target icon
- Users icon
- Dollar Sign icon
- Sparkles icon
- Lightbulb icon

## Data Structure
Make sure your data follows this structure:
```typescript
interface Vendor {
  company_name: string;
  company_type: 'Startup' | 'Private' | 'Public' | 'Subsidiary';
  headquarters: string;
  founding_year?: number;
  website_url?: string;
  description: string;
  core_services: string[];
  specialties: string[];
  customers: string[];
  key_features: string[];
  key_benefits: string[];
  competitive_advantages: string[];
  notable_customers: string[];
  competitors: string[];
  key_investors: string[];
  total_funding?: string;
  funding_stage?: string;
  employee_count_range?: string;
  business_model?: string;
  geographic_presence?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  linkedin_url?: string;
  twitter_url?: string;
}
```

## Responsive Behavior
- **Mobile (default)**: Single column layout
- **Tablet (md: 768px)**: Some cards switch to 2-column grid
- **Desktop (lg: 1024px)**: Main 3-column grid (2 cols + 1 sidebar)

## Next Steps
1. Copy the HTML template as a starting point
2. Implement the Card, Badge, and Breadcrumb components
3. Build the main VendorProfile component
4. Add your vendor data
5. Customize colors and spacing to match your app's design system
