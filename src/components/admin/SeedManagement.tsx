import { useState } from 'react';
import { useImageSeeds } from '@/hooks/useImageSeeds';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Star, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { CreateImageSeedRequest, UpdateImageSeedRequest } from '@/types/imageSeeds';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'business', label: 'Business' },
  { value: 'design', label: 'Design' },
  { value: 'general', label: 'General' },
  { value: 'cdi', label: 'CDI' },
  { value: 'contracts', label: 'Contracts' }
];

export const SeedManagement = () => {
  const { seeds, loading, createSeed, updateSeed, deleteSeed } = useImageSeeds();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSeed, setEditingSeed] = useState<string | null>(null);

  const createForm = useForm<CreateImageSeedRequest>();
  const editForm = useForm<UpdateImageSeedRequest>();

  const handleCreateSeed = async (data: CreateImageSeedRequest) => {
    try {
      await createSeed(data);
      setIsCreateModalOpen(false);
      createForm.reset();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleUpdateSeed = async (data: UpdateImageSeedRequest) => {
    if (!editingSeed) return;
    
    try {
      await updateSeed(editingSeed, data);
      setEditingSeed(null);
      editForm.reset();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleCopySeed = (seed: any) => {
    navigator.clipboard.writeText(seed.seed_value.toString());
    toast.success('Seed value copied to clipboard');
  };

  const generateRandomSeed = () => {
    return Math.floor(Math.random() * 999999999);
  };

  if (loading) {
    return <div>Loading seeds...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seed Management</h1>
          <p className="text-muted-foreground">
            Manage your image generation seeds for consistent results
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Seed
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Seed</DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(handleCreateSeed)} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...createForm.register('name', { required: true })}
                  placeholder="e.g., Consistent Healthcare Style"
                />
              </div>

              <div>
                <Label htmlFor="seed_value">Seed Value</Label>
                <div className="flex gap-2">
                  <Input
                    id="seed_value"
                    type="number"
                    {...createForm.register('seed_value', { 
                      required: true,
                      valueAsNumber: true,
                      min: 0,
                      max: 9223372036854775807
                    })}
                    placeholder="123456789"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => createForm.setValue('seed_value', generateRandomSeed())}
                  >
                    Random
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => createForm.setValue('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  {...createForm.register('description')}
                  placeholder="Describe when to use this seed..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  onCheckedChange={(checked) => createForm.setValue('is_default', checked)}
                />
                <Label htmlFor="is_default">Set as default for this category</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Seed</Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {seeds.map((seed) => (
          <Card key={seed.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {seed.name}
                    {seed.is_default && (
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{seed.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopySeed(seed)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Dialog
                    open={editingSeed === seed.id}
                    onOpenChange={(open) => {
                      if (open) {
                        setEditingSeed(seed.id);
                        editForm.reset({
                          name: seed.name,
                          seed_value: seed.seed_value,
                          description: seed.description,
                          category: seed.category,
                          is_default: seed.is_default
                        });
                      } else {
                        setEditingSeed(null);
                        editForm.reset();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Seed</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={editForm.handleSubmit(handleUpdateSeed)} className="space-y-4">
                        <div>
                          <Label htmlFor="edit_name">Name</Label>
                          <Input
                            id="edit_name"
                            {...editForm.register('name', { required: true })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="edit_seed_value">Seed Value</Label>
                          <div className="flex gap-2">
                            <Input
                              id="edit_seed_value"
                              type="number"
                              {...editForm.register('seed_value', { 
                                required: true,
                                valueAsNumber: true,
                                min: 0,
                                max: 9223372036854775807
                              })}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => editForm.setValue('seed_value', generateRandomSeed())}
                            >
                              Random
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="edit_category">Category</Label>
                          <Select
                            value={editForm.watch('category')}
                            onValueChange={(value) => editForm.setValue('category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="edit_description">Description</Label>
                          <Textarea
                            id="edit_description"
                            {...editForm.register('description')}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="edit_is_default"
                            checked={editForm.watch('is_default')}
                            onCheckedChange={(checked) => editForm.setValue('is_default', checked)}
                          />
                          <Label htmlFor="edit_is_default">Set as default for this category</Label>
                        </div>

                        <div className="flex gap-2">
                          <Button type="submit">Update Seed</Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setEditingSeed(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSeed(seed.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Seed Value:</span>
                  <div className="font-mono">{seed.seed_value}</div>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <div>
                    <Badge variant="outline">{seed.category}</Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <div>{new Date(seed.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {seeds.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              No seeds found. Create your first seed to get started.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};