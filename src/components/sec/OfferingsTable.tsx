import React, { useState } from "react";
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
  Eye, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useOfferings, useOfferingDetail } from "@/hooks/useSecQueries";
import type { OfferingFilters } from "@/types/sec";
import { OfferingDetailModal } from "./OfferingDetailModal";

interface OfferingsTableProps {
  filters: any;
  onCompanySelect: (company: any) => void;
}

export const OfferingsTable: React.FC<OfferingsTableProps> = ({ 
  filters, 
  onCompanySelect 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("sale_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 100;

  // Build filters including search and sorting
  const queryFilters: OfferingFilters = {
    ...filters,
    searchQuery: searchQuery || undefined,
    sortField: sortField,
    sortDirection: sortDirection,
  };

  const { data: offeringsData, isLoading, error } = useOfferings(queryFilters, currentPage, itemsPerPage);
  const { data: selectedOfferingDetail, isLoading: isDetailLoading } = useOfferingDetail(selectedOfferingId || undefined);

  let offerings = offeringsData?.data || [];
  
  // Handle client-side sorting for fields that need special handling
  if (offerings.length > 0) {
    offerings = [...offerings].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "companyName":
          const nameA = a.issuers?.[0]?.entityname || '';
          const nameB = b.issuers?.[0]?.entityname || '';
          comparison = nameA.localeCompare(nameB);
          break;
          
        case "percentRaised":
          const percentA = a.totalofferingamount && a.totalamountsold ? 
            (a.totalamountsold / a.totalofferingamount) * 100 : 0;
          const percentB = b.totalofferingamount && b.totalamountsold ? 
            (b.totalamountsold / b.totalofferingamount) * 100 : 0;
          comparison = percentA - percentB;
          break;
          
        case "amountRaised":
          const amountA = Number(a.totalofferingamount) || 0;
          const amountB = Number(b.totalofferingamount) || 0;
          comparison = amountA - amountB;
          break;
          
        case "amountSold":
          const soldA = Number(a.totalamountsold) || 0;
          const soldB = Number(b.totalamountsold) || 0;
          comparison = soldA - soldB;
          break;
          
        case "dateOfFirstSale":
          const dateA = new Date(a.sale_date || 0).getTime();
          const dateB = new Date(b.sale_date || 0).getTime();
          comparison = dateA - dateB;
          break;
          
        case "industry":
          const industryA = a.industrygrouptype || '';
          const industryB = b.industrygrouptype || '';
          comparison = industryA.localeCompare(industryB);
          break;
          
        default:
          return 0;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  // Use actual filtered results count instead of database total
  const actualResultsCount = offerings.length;
  const totalItems = offeringsData?.count || actualResultsCount; // Use count from filtered results
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Calculate display range based on actual results
  const displayedStart = actualResultsCount > 0 ? startIndex + 1 : 0;
  const displayedEnd = Math.min(startIndex + actualResultsCount, startIndex + itemsPerPage);

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
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-2 h-4 w-4 text-primary" /> : 
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
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
          <CardTitle>SEC Offerings</CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search companies or industries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={7} className="text-center py-8 text-red-500">
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
              ) : offerings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <div>
                      <p className="font-semibold">No SEC offerings found</p>
                      <p className="text-sm mt-1">
                        {filters.useDefaultFilters 
                          ? "No US tech companies with fully raised funding found. Try adjusting your filters."
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
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedOfferingId(offering.accessionnumber);
                      setIsModalOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">
                          {offering.issuers?.[0]?.entityname || 'Unknown Company'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {offering.issuers?.[0]?.city && offering.issuers?.[0]?.stateorcountrydescription 
                            ? `${offering.issuers[0].city}, ${offering.issuers[0].stateorcountrydescription}`
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
                      {offering.sale_date ? formatDate(offering.sale_date) : 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {offering.industrygrouptype || 'Other'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {offering.signatures?.[0]?.nameofsigner || 'Not specified'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            {actualResultsCount > 0 ? (
              `Showing ${displayedStart} to ${displayedEnd} of ${totalItems} entries`
            ) : (
              'No entries found'
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
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
    </Card>
  );
};