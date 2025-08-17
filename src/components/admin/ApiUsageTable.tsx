import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  Calendar,
  User,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { ApiUsageRecord } from "@/types/apiUsage";
import { 
  formatCurrency, 
  formatTokens, 
  getCostColorClass,
  getModelDisplayName,
  getFunctionDisplayName
} from "@/utils/costCalculator";
import { format } from "date-fns";

interface ApiUsageTableProps {
  data: ApiUsageRecord[];
  onViewDetails: (record: ApiUsageRecord) => void;
  isLoading?: boolean;
}

type SortField = 'created_at' | 'estimated_cost' | 'total_tokens' | 'response_time_ms';
type SortDirection = 'asc' | 'desc';

export const ApiUsageTable = ({ data, onViewDetails, isLoading }: ApiUsageTableProps) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'created_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-3 w-3" /> : 
      <ChevronDown className="h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Timestamp</span>
                  <SortIcon field="created_at" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>User</span>
                </div>
              </TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Type</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('total_tokens')}
              >
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>Tokens/Size</span>
                  <SortIcon field="total_tokens" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('estimated_cost')}
              >
                <div className="flex items-center space-x-1">
                  <span>Cost</span>
                  <SortIcon field="estimated_cost" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('response_time_ms')}
              >
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Duration</span>
                  <SortIcon field="response_time_ms" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(record.created_at), 'MMM dd, HH:mm')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[120px] truncate">
                    <div className="text-sm font-medium">
                      {record.user_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {record.user_email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {getFunctionDisplayName(record.function_name)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getModelDisplayName(record.model_used)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {record.request_type.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {record.total_tokens ? (
                    <span className="text-sm">{formatTokens(record.total_tokens)}</span>
                  ) : record.image_size ? (
                    <span className="text-sm">{record.image_size}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span className={`text-sm font-medium ${getCostColorClass(record.estimated_cost)}`}>
                      {formatCurrency(record.estimated_cost)}
                    </span>
                    {record.actual_cost !== undefined && record.openai_synced && (
                      <div className="text-xs text-muted-foreground">
                        Actual: {formatCurrency(record.actual_cost)}
                      </div>
                    )}
                    {record.openai_synced && (
                      <div className="text-xs">
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          {record.sync_status === 'synced' ? '✓ Synced' : 'Pending'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {record.response_time_ms && (
                    <span className="text-sm">
                      {(record.response_time_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={record.success ? "default" : "destructive"}>
                    {record.success ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {record.success ? 'Success' : 'Failed'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(record)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {sortedData.map((record) => (
          <Card key={record.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium mb-1">
                    {getFunctionDisplayName(record.function_name)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
                <Badge variant={record.success ? "default" : "destructive"}>
                  {record.success ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {record.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">User:</span>
                  <div className="truncate">{record.user_name || record.user_email}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Model:</span>
                  <div>{getModelDisplayName(record.model_used)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {record.total_tokens ? 'Tokens:' : 'Size:'}
                  </span>
                  <div>
                    {record.total_tokens ? 
                      formatTokens(record.total_tokens) : 
                      record.image_size || 'N/A'
                    }
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <div className="space-y-1">
                    <div className={`font-medium ${getCostColorClass(record.estimated_cost)}`}>
                      {formatCurrency(record.estimated_cost)}
                    </div>
                    {record.actual_cost !== undefined && record.openai_synced && (
                      <div className="text-xs text-muted-foreground">
                        Actual: {formatCurrency(record.actual_cost)}
                      </div>
                    )}
                    {record.openai_synced && (
                      <Badge variant="outline" className="text-xs py-0 px-1">
                        {record.sync_status === 'synced' ? '✓ Synced' : 'Pending'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <Badge variant="secondary">
                  {record.request_type.replace('_', ' ')}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(record)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};