import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Check, Building2, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useVendorCompanyNames, useCreateVendorCompetitor } from '@/hooks/useVendorCompetitors';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CompetitorSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
}

export function CompetitorSelector({ value, onChange, maxItems = 10 }: CompetitorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const { data: companies = [], isLoading } = useVendorCompanyNames();
  const createVendorMutation = useCreateVendorCompetitor();

  // Filter companies that aren't already selected as competitors
  const availableCompanies = companies.filter(
    company => !value.includes(company.company_name)
  );

  // Filter companies based on search
  const filteredCompanies = availableCompanies.filter(company =>
    company.company_name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelectCompetitor = (companyName: string) => {
    if (value.length < maxItems && !value.includes(companyName)) {
      onChange([...value, companyName]);
    }
    setOpen(false);
    setSearchValue('');
  };

  const handleCreateAndAddCompetitor = async () => {
    if (!searchValue.trim()) return;
    
    try {
      const newVendor = await createVendorMutation.mutateAsync(searchValue.trim());
      handleSelectCompetitor(newVendor.company_name);
    } catch (error) {
      console.error('Failed to create competitor:', error);
    }
  };

  const handleRemoveCompetitor = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const shouldShowCreateOption = searchValue.trim() && 
    !filteredCompanies.some(company => 
      company.company_name.toLowerCase() === searchValue.toLowerCase()
    );

  return (
    <div className="space-y-3">
      {/* Display current competitors with improved styling */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((competitor, index) => (
            <div 
              key={index} 
              className="group flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">{competitor}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Competitor
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveCompetitor(index)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Add new competitor with improved design */}
      {value.length < maxItems && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-center gap-2 h-11 text-sm border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add competitor
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <CommandInput
                  placeholder="Search companies or add new..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                  className="border-0 px-0 focus:ring-0"
                />
              </div>
              <CommandList className="max-h-64">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-pulse text-sm text-muted-foreground">
                      Loading companies...
                    </div>
                  </div>
                ) : (
                  <>
                    {filteredCompanies.length > 0 && (
                      <CommandGroup heading="Existing Companies">
                        {filteredCompanies.slice(0, 8).map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.company_name}
                            onSelect={() => handleSelectCompetitor(company.company_name)}
                            className="flex items-center gap-3 p-3 cursor-pointer"
                          >
                            <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{company.company_name}</div>
                              <div className="text-xs text-muted-foreground">Existing vendor</div>
                            </div>
                            <Check className="h-4 w-4 opacity-0" />
                          </CommandItem>
                        ))}
                        {filteredCompanies.length > 8 && (
                          <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                            +{filteredCompanies.length - 8} more companies
                          </div>
                        )}
                      </CommandGroup>
                    )}
                    
                    {shouldShowCreateOption && (
                      <CommandGroup heading="Create New">
                        <CommandItem
                          value={searchValue}
                          onSelect={handleCreateAndAddCompetitor}
                          disabled={createVendorMutation.isPending}
                          className="flex items-center gap-3 p-3 cursor-pointer"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {createVendorMutation.isPending 
                                ? `Creating "${searchValue}"...` 
                                : `Add "${searchValue}"`
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {createVendorMutation.isPending 
                                ? 'Please wait...' 
                                : 'Create new vendor and add as competitor'
                              }
                            </div>
                          </div>
                          {createVendorMutation.isPending && (
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          )}
                        </CommandItem>
                      </CommandGroup>
                    )}
                    
                    {filteredCompanies.length === 0 && !shouldShowCreateOption && (
                      <CommandEmpty className="p-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                          <div className="text-sm font-medium">
                            {searchValue ? 'No companies found' : 'Start typing to search'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {searchValue ? 'Try a different search term' : 'Search existing companies or create new ones'}
                          </div>
                        </div>
                      </CommandEmpty>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      
      {/* Footer info */}
      {value.length === maxItems && (
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/20 rounded-lg">
          Maximum of {maxItems} competitors reached
        </div>
      )}
    </div>
  );
}