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
              className="w-full justify-center gap-2 h-11 text-sm border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 animate-fade-in"
            >
              <Plus className="h-4 w-4" />
              Add competitor
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0 animate-scale-in" align="start" side="bottom">
            <Command className="rounded-lg border-0 shadow-lg">
              <div className="flex items-center border-b px-4 py-2 bg-muted/20">
                <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                <CommandInput
                  placeholder="Search companies or add new..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                  className="border-0 px-0 focus:ring-0 bg-transparent placeholder:text-muted-foreground/70"
                />
              </div>
              <CommandList className="max-h-80 overflow-auto">
                {isLoading ? (
                  <div className="p-6 text-center animate-pulse">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      <span className="text-sm text-muted-foreground">Loading companies...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {filteredCompanies.length > 0 && (
                      <CommandGroup heading="Existing Companies" className="p-2">
                        <div className="space-y-1">
                          {filteredCompanies.slice(0, 8).map((company) => (
                            <CommandItem
                              key={company.id}
                              value={company.company_name}
                              onSelect={() => handleSelectCompetitor(company.company_name)}
                              className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-accent/50 transition-all duration-200 group data-[selected]:bg-accent"
                            >
                              <div className="flex items-center justify-center w-10 h-10 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors duration-200">
                                <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-foreground truncate">{company.company_name}</div>
                                <div className="text-xs text-muted-foreground">Existing vendor</div>
                              </div>
                              <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to add
                              </div>
                            </CommandItem>
                          ))}
                        </div>
                        {filteredCompanies.length > 8 && (
                          <div className="px-3 py-2 mt-2 text-xs text-muted-foreground text-center border-t bg-muted/10 rounded-b-lg">
                            +{filteredCompanies.length - 8} more companies available
                          </div>
                        )}
                      </CommandGroup>
                    )}
                    
                    {shouldShowCreateOption && (
                      <CommandGroup heading="Create New" className="p-2">
                        <CommandItem
                          value={searchValue}
                          onSelect={handleCreateAndAddCompetitor}
                          disabled={createVendorMutation.isPending}
                          className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-accent/50 transition-all duration-200 group data-[selected]:bg-accent disabled:opacity-50"
                        >
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-200">
                            {createVendorMutation.isPending ? (
                              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                            ) : (
                              <Plus className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground">
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
                          {!createVendorMutation.isPending && (
                            <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to create
                            </div>
                          )}
                        </CommandItem>
                      </CommandGroup>
                    )}
                    
                    {filteredCompanies.length === 0 && !shouldShowCreateOption && (
                      <CommandEmpty className="p-8 text-center animate-fade-in">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-foreground">
                              {searchValue ? 'No companies found' : 'Start typing to search'}
                            </div>
                            <div className="text-xs text-muted-foreground max-w-48">
                              {searchValue ? 'Try a different search term or create a new company' : 'Search existing companies or create new ones'}
                            </div>
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