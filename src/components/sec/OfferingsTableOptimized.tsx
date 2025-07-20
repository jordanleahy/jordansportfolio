
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft,
  ChevronRight,
  FileText,
  X
} from "lucide-react";
import { useOfferings, useOfferingDetail } from "@/hooks/useSecQueries";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import type { OfferingFilters } from "@/types/sec";
import { OfferingDetailModal } from "./OfferingDetailModal";
import { PromptModal } from "./PromptModal";
import { OfferingCard } from "./OfferingCard";

// Utility function for generating vendor research prompts
const generateVendorPrompt = (websiteUrl: string) => {
  return `I need you to research this company thoroughly and provide detailed information in JSON format.

Website: ${websiteUrl}

Please browse their website and provide the following information in valid JSON format:

{
  "company_name": "Exact company name",
  "website_url": "${websiteUrl}",
  "description": "Detailed description of what the company does",
  "industry": "Primary industry/sector",
  "services": ["List", "of", "main", "services"],
  "target_market": "Who they serve",
  "company_size": "Estimated number of employees",
  "founded_year": "Year founded (if available)",
  "headquarters": "Location of main office",
  "key_technologies": ["List", "of", "technologies", "they", "use"],
  "pricing_model": "How they charge (if available)",
  "contact_info": {
    "email": "Contact email",
    "phone": "Phone number",
    "address": "Physical address"
  },
  "social_media": {
    "linkedin": "LinkedIn URL",
    "twitter": "Twitter URL"
  },
  "competitors": ["List", "of", "main", "competitors"],
  "unique_value_proposition": "What makes them different",
  "recent_news": ["Any", "recent", "news", "or", "updates"]
}

Please ensure the JSON is valid and complete. If any information is not available, use null or an empty array as appropriate.`;
};

interface OfferingsTableOptimizedProps {
  filters: any;
  onCompanySelect: (company: any) => void;
}

export const OfferingsTableOptimized: React.FC<OfferingsTableOptimizedProps> = ({ 
  filters, 
  onCompanySelect 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("dateOfFirstSale");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [promptCompanyName, setPromptCompanyName] = useState("");
  const itemsPerPage = 50; // Optimized page size

  // Debounce search query for performance with longer delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const isMobile = useIsMobile();

  // Check if search query is too short
  const isSearchTooShort = searchQuery.length > 0 && searchQuery.length < 2;
  const isSearching = searchQuery !== debouncedSearchQuery;

  // Build filters - all processing is now server-side
  const queryFilters: OfferingFilters = {
    ...filters,
    searchQuery: debouncedSearchQuery || undefined,
    sortField: sortField,
    sortDirection: sortDirection,
  };

  const { data: offeringsData, isLoading, error } = useOfferings(queryFilters, currentPage, itemsPerPage);
  const { data: selectedOfferingDetail, isLoading: isDetailLoading } = useOfferingDetail(selectedOfferingId || undefined);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, filters, sortField, sortDirection]);

  // All data comes pre-processed from the server
  const offerings = offeringsData?.data || [];
  const totalItems = offeringsData?.total || 0;
  const totalPages = offeringsData?.totalPages || 0;
  const currentResults = offerings.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatPercentage = (amountSold: number, totalOffering: number) => {
    if (!amountSold || !totalOffering || totalOffering === 0) return 'N/A';
    const percentage = (amountSold / totalOffering) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-2 h-4 w-4 text-primary" /> : 
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const handleGeneratePrompt = (offering: any) => {
    const companyName = offering.issuers?.[0]?.entityname || offering.company_name || 'Unknown Company';
    const prompt = generateVendorPrompt(`https://example.com/${companyName}`);
    setGeneratedPrompt(prompt);
    setPromptCompanyName(companyName);
    setIsPromptModalOpen(true);
  };

  const getSearchMessage = () => {
    if (isSearchTooShort) {
      return "Type at least 2 characters to search";
    }
    if (isSearching) {
      return "Searching...";
    }
    if (debouncedSearchQuery && currentResults > 0) {
      return `Found ${currentResults} of ${totalItems} results`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full sm:w-80" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[...Array(7)].map((_, i) => (
                      <TableHead key={i}>
                        <Skeleton className="h-4 w-24" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(8)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>SEC Offerings ({totalItems.toLocaleString()} total)</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search companies, industries, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground min-h-[24px]">
              {getSearchMessage() && (
                <span className={isSearchTooShort ? "text-amber-600" : ""}>
                  {getSearchMessage()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile Card Layout */}
        {isMobile ? (
          <div className="p-4 space-y-4">
            {error ? (
              <div className="text-center py-8 text-red-500">
                <div>
                  <p className="font-semibold">Error loading SEC offerings</p>
                  <p className="text-sm mt-1">{error.message}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : isSearchTooShort ? (
              <div className="text-center py-8 text-amber-600">
                <p className="font-semibold">Search too short</p>
                <p className="text-sm mt-1">Please type at least 2 characters to search</p>
              </div>
            ) : offerings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div>
                  <p className="font-semibold">No SEC offerings found</p>
                  <p className="text-sm mt-1">
                    {filters.useDefaultFilters 
                      ? "No US tech companies found with these filters. Try adjusting your criteria."
                      : "Import data or adjust your search criteria to see results."
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {offerings.map((offering: any) => (
                  <OfferingCard
                    key={offering.accessionnumber}
                    offering={offering}
                    onGeneratePrompt={handleGeneratePrompt}
                    onViewDetails={(offeringId) => {
                      setSelectedOfferingId(offeringId);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Desktop Table Layout */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Actions</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("companyName")}
                      className="h-auto p-0 font-semibold hover:bg-muted/50"
                    >
                      Company Name
                      {getSortIcon("companyName")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("amountRaised")}
                      className="h-auto p-0 font-semibold hover:bg-muted/50"
                    >
                      Raise Target
                      {getSortIcon("amountRaised")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("amountSold")}
                      className="h-auto p-0 font-semibold hover:bg-muted/50"
                    >
                      Amount Sold
                      {getSortIcon("amountSold")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("percentRaised")}
                      className="h-auto p-0 font-semibold hover:bg-muted/50"
                    >
                      % Raised
                      {getSortIcon("percentRaised")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("dateOfFirstSale")}
                      className="h-auto p-0 font-semibold hover:bg-muted/50"
                    >
                      Date of First Sale
                      {getSortIcon("dateOfFirstSale")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("industry")}
                      className="h-auto p-0 font-semibold hover:bg-muted/50"
                    >
                      Industry
                      {getSortIcon("industry")}
                    </Button>
                  </TableHead>
                  <TableHead>Founder/Executive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-red-500">
                      <div>
                        <p className="font-semibold">Error loading SEC offerings</p>
                        <p className="text-sm mt-1">{error.message}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => window.location.reload()}
                        >
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isSearchTooShort ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-amber-600">
                      <div>
                        <p className="font-semibold">Search too short</p>
                        <p className="text-sm mt-1">Please type at least 2 characters to search</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : offerings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <div>
                        <p className="font-semibold">No SEC offerings found</p>
                        <p className="text-sm mt-1">
                          {filters.useDefaultFilters 
                            ? "No US tech companies found with these filters. Try adjusting your criteria."
                            : "Import data or adjust your search criteria to see results."
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  offerings.map((offering: any) => (
                    <TableRow 
                      key={offering.accessionnumber}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGeneratePrompt(offering);
                          }}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Generate Prompt
                        </Button>
                      </TableCell>
                      <TableCell 
                        className="font-medium cursor-pointer"
                        onClick={() => {
                          setSelectedOfferingId(offering.accessionnumber);
                          setIsModalOpen(true);
                        }}
                      >
                        <div>
                          <div className="font-semibold">
                            {offering.issuers?.[0]?.entityname || offering.company_name || 'Unknown Company'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {offering.issuers?.[0]?.city && offering.issuers?.[0]?.stateorcountrydescription 
                              ? `${offering.issuers[0].city}, ${offering.issuers[0].stateorcountrydescription}`
                              : offering.company_city && offering.company_location
                              ? `${offering.company_city}, ${offering.company_location}`
                              : 'Location not specified'
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {offering.totalofferingamount 
                          ? formatCurrency(offering.totalofferingamount) 
                          : 'Not disclosed'
                        }
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {offering.totalamountsold 
                          ? formatCurrency(offering.totalamountsold) 
                          : 'Not disclosed'
                        }
                      </TableCell>
                      <TableCell className="font-semibold text-purple-600">
                        {formatPercentage(offering.totalamountsold, offering.totalofferingamount)}
                      </TableCell>
                      <TableCell>
                        {formatDate(offering.sale_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {offering.industrygrouptype || 'Other'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {offering.signatures?.[0]?.nameofsigner || offering.primary_signer || 'Not specified'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Optimized Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            {currentResults > 0 ? (
              `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${((currentPage - 1) * itemsPerPage) + currentResults} of ${totalItems.toLocaleString()} entries`
            ) : (
              'No entries found'
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <OfferingDetailModal
        offering={selectedOfferingDetail}
        isOpen={isModalOpen}
        isLoading={isDetailLoading}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOfferingId(null);
        }}
      />

      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        prompt={generatedPrompt}
        companyName={promptCompanyName}
      />
    </Card>
  );
};
