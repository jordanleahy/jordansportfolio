import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, Star, Archive, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUseCases, useUseCaseActions, useCategories, useIndustries } from '@/hooks/useUseCases';
import type { UseCaseFilters, UseCaseStatus, UseCaseComplexity } from '@/types/useCases';
import { toast } from 'sonner';
import { formatDistance } from 'date-fns';

export default function AdminUseCases() {
  const [filters, setFilters] = useState<UseCaseFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: useCases = [], isLoading, refetch } = useUseCases(filters);
  const { data: categories = [] } = useCategories();
  const { data: industries = [] } = useIndustries();
  const { delete: deleteUseCase } = useUseCaseActions();

  const handleFilterChange = (key: keyof UseCaseFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' || !value ? undefined : value
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(useCases.map(uc => uc.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUseCase.mutateAsync(id);
      toast.success('Use case deleted successfully');
      refetch();
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete use case');
    }
  };

  const getStatusBadge = (status: UseCaseStatus) => {
    const variants = {
      draft: 'secondary',
      published: 'default', 
      archived: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    );
  };

  const getComplexityBadge = (complexity: UseCaseComplexity) => {
    const variants = {
      simple: 'default',
      medium: 'secondary',
      complex: 'destructive'
    } as const;

    return (
      <Badge variant={variants[complexity]}>
        {complexity}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Use Cases</h1>
          <p className="text-muted-foreground">Manage use cases for your platform</p>
        </div>
        <Button asChild>
          <Link to="/admin/use-cases/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Use Case
          </Link>
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search use cases..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.industry || 'all'} onValueChange={(value) => handleFilterChange('industry', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value as UseCaseStatus)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-muted p-3">
            <CheckSquare className="h-4 w-4" />
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <Button size="sm" variant="outline">
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <Button size="sm" variant="outline">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={useCases.length > 0 && selectedIds.length === useCases.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Complexity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading use cases...
                </TableCell>
              </TableRow>
            ) : useCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No use cases found
                </TableCell>
              </TableRow>
            ) : (
              useCases.map((useCase) => (
                <TableRow key={useCase.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(useCase.id)}
                      onCheckedChange={(checked) => handleSelectOne(useCase.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {useCase.featured && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                      {useCase.title}
                    </div>
                  </TableCell>
                  <TableCell>{useCase.category || '-'}</TableCell>
                  <TableCell>{useCase.industry || '-'}</TableCell>
                  <TableCell>{getComplexityBadge(useCase.complexity)}</TableCell>
                  <TableCell>{getStatusBadge(useCase.status)}</TableCell>
                  <TableCell>
                    {useCase.featured ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistance(new Date(useCase.created_at), new Date(), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/admin/use-cases/${useCase.id}/preview`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/admin/use-cases/${useCase.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setDeleteId(useCase.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Use Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this use case? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}