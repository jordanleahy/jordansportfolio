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
  Mail, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface OfferingsTableProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  filters: any;
  onCompanySelect: (company: any) => void;
}

export const OfferingsTable: React.FC<OfferingsTableProps> = ({ 
  dateRange, 
  filters, 
  onCompanySelect 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("dateOfFirstSale");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Mock data for now
  const mockOfferings = [
    {
      id: "1",
      companyName: "TechCorp Industries",
      amountRaised: 15000000,
      dateOfFirstSale: "2024-01-15",
      industry: "Technology",
      founder: "Sarah Johnson",
      status: "Active",
      location: "San Francisco, CA"
    },
    {
      id: "2", 
      companyName: "BioMed Solutions",
      amountRaised: 25000000,
      dateOfFirstSale: "2024-01-10",
      industry: "Healthcare",
      founder: "Dr. Michael Chen",
      status: "Active",
      location: "Boston, MA"
    },
    {
      id: "3",
      companyName: "GreenEnergy Co",
      amountRaised: 45000000,
      dateOfFirstSale: "2024-01-08",
      industry: "Energy",
      founder: "Amanda Rodriguez",
      status: "Active", 
      location: "Austin, TX"
    },
    {
      id: "4",
      companyName: "FinTech Innovations",
      amountRaised: 8500000,
      dateOfFirstSale: "2024-01-05",
      industry: "Financial Services",
      founder: "David Kim",
      status: "Active",
      location: "New York, NY"
    },
    {
      id: "5",
      companyName: "RetailNext Platform",
      amountRaised: 12000000,
      dateOfFirstSale: "2024-01-03",
      industry: "Retail",
      founder: "Lisa Wang",
      status: "Active",
      location: "Seattle, WA"
    }
  ];

  const isLoading = false;

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
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const filteredData = mockOfferings.filter(offering =>
    offering.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offering.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
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
                    className="h-auto p-0 font-semibold"
                  >
                    Company Name
                    {getSortIcon("companyName")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("amountRaised")}
                    className="h-auto p-0 font-semibold"
                  >
                    Amount Raised
                    {getSortIcon("amountRaised")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("dateOfFirstSale")}
                    className="h-auto p-0 font-semibold"
                  >
                    Date of First Sale
                    {getSortIcon("dateOfFirstSale")}
                  </Button>
                </TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Founder/Executive</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((offering) => (
                <TableRow 
                  key={offering.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onCompanySelect(offering)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{offering.companyName}</div>
                      <div className="text-sm text-muted-foreground">{offering.location}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(offering.amountRaised)}
                  </TableCell>
                  <TableCell>{formatDate(offering.dateOfFirstSale)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{offering.industry}</Badge>
                  </TableCell>
                  <TableCell>{offering.founder}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompanySelect(offering);
                        }}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
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
    </Card>
  );
};