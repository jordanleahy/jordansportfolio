import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type Investor } from '@/types/investor';

interface InvestorsTableViewProps {
  investors: Investor[];
  onInvestorClick?: (investor: Investor) => void;
  onDeleteClick?: (investor: Investor) => void;
}

type SortField = 'firm_name' | 'city' | 'state' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export function InvestorsTableView({ 
  investors, 
  onInvestorClick, 
  onDeleteClick 
}: InvestorsTableViewProps) {
  // Default sort by most recent activity (updated_at)
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'updated_at' ? 'desc' : 'asc');
    }
  };

  const sortedInvestors = [...investors].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === 'updated_at') {
      // Convert date strings to Date objects for proper comparison
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(0)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  const formatCheckSize = (investor: Investor) => {
    if (investor.check_size_min && investor.check_size_max) {
      return `${formatCurrency(investor.check_size_min)} - ${formatCurrency(investor.check_size_max)}`;
    } else if (investor.check_size_min) {
      return `${formatCurrency(investor.check_size_min)}+`;
    } else if (investor.check_size_max) {
      return `Up to ${formatCurrency(investor.check_size_max)}`;
    }
    return 'N/A';
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[200px]"
                  onClick={() => handleSort('firm_name')}
                >
                  <div className="flex items-center gap-2">
                    Firm Name
                    {sortField === 'firm_name' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="min-w-[200px]">Address</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[120px]"
                  onClick={() => handleSort('city')}
                >
                  <div className="flex items-center gap-2">
                    City
                    {sortField === 'city' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[80px]"
                  onClick={() => handleSort('state')}
                >
                  <div className="flex items-center gap-2">
                    State
                    {sortField === 'state' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="min-w-[80px]">Zip</TableHead>
                <TableHead className="min-w-[200px]">Sector Focus</TableHead>
                <TableHead className="min-w-[120px]">Stage</TableHead>
                <TableHead className="min-w-[150px]">Check Size</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[150px]"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center gap-2">
                    Last Activity
                    {sortField === 'updated_at' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvestors.map((investor) => (
                <TableRow 
                  key={investor.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onInvestorClick?.(investor)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium hover:text-primary">{investor.firm_name}</div>
                      {investor.lead_partner && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {investor.lead_partner}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {investor.address || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{investor.city || 'N/A'}</TableCell>
                  <TableCell>{investor.state || 'N/A'}</TableCell>
                  <TableCell>{investor.zip || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {investor.sector_focus.slice(0, 2).map((sector, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {sector}
                        </Badge>
                      ))}
                      {investor.sector_focus.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{investor.sector_focus.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {investor.stage && (
                      <Badge variant="outline">
                        {investor.stage}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatCheckSize(investor)}</div>
                  </TableCell>
                  <TableCell>{formatDate(investor.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onDeleteClick && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(investor);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {investor.website && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(investor.website, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedInvestors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No investors found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}