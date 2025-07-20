import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useVendorCompanyNames, useCreateVendorCompetitor } from '@/hooks/useVendorCompetitors';
import { cn } from '@/lib/utils';

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
    <div className="space-y-2">
      {/* Display current competitors */}
      {value.map((competitor, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex-shrink-0">•</span>
          <span className="text-xs flex-1">{competitor}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleRemoveCompetitor(index)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      
      {/* Add new competitor */}
      {value.length < maxItems && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-xs h-8"
            >
              Add competitor...
              <Plus className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search companies or add new..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                {isLoading ? (
                  <CommandEmpty>Loading companies...</CommandEmpty>
                ) : (
                  <>
                    {filteredCompanies.length > 0 && (
                      <CommandGroup heading="Existing Companies">
                        {filteredCompanies.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.company_name}
                            onSelect={() => handleSelectCompetitor(company.company_name)}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            {company.company_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    
                    {shouldShowCreateOption && (
                      <CommandGroup heading="Create New">
                        <CommandItem
                          value={searchValue}
                          onSelect={handleCreateAndAddCompetitor}
                          disabled={createVendorMutation.isPending}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {createVendorMutation.isPending 
                            ? `Creating "${searchValue}"...` 
                            : `Add "${searchValue}" as new competitor`
                          }
                        </CommandItem>
                      </CommandGroup>
                    )}
                    
                    {filteredCompanies.length === 0 && !shouldShowCreateOption && (
                      <CommandEmpty>
                        {searchValue ? 'No companies found.' : 'Start typing to search...'}
                      </CommandEmpty>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}