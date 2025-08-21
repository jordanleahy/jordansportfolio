import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Plus, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUseCase, useUseCaseActions, useCategories, useIndustries } from '@/hooks/useUseCases';
import type { CreateUseCase, UpdateUseCase } from '@/types/useCases';
import { toast } from 'sonner';

const useCaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  category: z.string().optional(),
  industry: z.string().optional(),
  complexity: z.enum(['simple', 'medium', 'complex']).default('medium'),
  target_audience: z.string().optional(),
  business_value: z.string().optional(),
  technical_requirements: z.array(z.object({ value: z.string() })).default([]),
  tags: z.array(z.object({ value: z.string() })).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  sort_order: z.number().default(0),
});

type UseCaseFormData = z.infer<typeof useCaseSchema>;

export default function UseCaseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { data: useCase, isLoading } = useUseCase(id || '');
  const { data: categories = [] } = useCategories();
  const { data: industries = [] } = useIndustries();
  const { create, update } = useUseCaseActions();

  const form = useForm<UseCaseFormData>({
    resolver: zodResolver(useCaseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      industry: '',
      complexity: 'medium',
      target_audience: '',
      business_value: '',
      technical_requirements: [],
      tags: [],
      status: 'draft',
      featured: false,
      sort_order: 0,
    },
  });

  const { fields: techReqFields, append: appendTechReq, remove: removeTechReq } = useFieldArray<UseCaseFormData>({
    control: form.control,
    name: 'technical_requirements',
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray<UseCaseFormData>({
    control: form.control,
    name: 'tags',
  });

  useEffect(() => {
    if (useCase) {
      form.reset({
        title: useCase.title,
        description: useCase.description,
        category: useCase.category || '',
        industry: useCase.industry || '',
        complexity: useCase.complexity,
        target_audience: useCase.target_audience || '',
        business_value: useCase.business_value || '',
        technical_requirements: useCase.technical_requirements?.map(req => ({ value: req })) || [],
        tags: useCase.tags?.map(tag => ({ value: tag })) || [],
        status: useCase.status,
        featured: useCase.featured,
        sort_order: useCase.sort_order,
      });
    }
  }, [useCase, form]);

  const onSubmit = async (data: UseCaseFormData) => {
    try {
      // Transform the data to match the expected format
      const transformedData = {
        ...data,
        technical_requirements: data.technical_requirements.map(req => req.value),
        tags: data.tags.map(tag => tag.value),
      };

      if (isEdit && id) {
        await update.mutateAsync({ id, ...transformedData } as UpdateUseCase);
        toast.success('Use case updated successfully');
      } else {
        await create.mutateAsync(transformedData as CreateUseCase);
        toast.success('Use case created successfully');
      }
      navigate('/admin/use-cases');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update use case' : 'Failed to create use case');
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading use case...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/use-cases')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Use Case' : 'Create Use Case'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update the use case details' : 'Add a new use case to your platform'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter use case title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the use case in detail..." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {industries.map(industry => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="complexity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complexity</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Simple</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="complex">Complex</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="target_audience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Who is this use case for?"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="business_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Value</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What business value does this use case provide?"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label>Technical Requirements</Label>
                    <div className="space-y-2 mt-2">
                      {techReqFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <Input
                            placeholder="Enter requirement..."
                            {...form.register(`technical_requirements.${index}.value` as const)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeTechReq(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendTechReq({ value: '' })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Requirement
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="space-y-2 mt-2">
                      {tagFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <Input
                            placeholder="Enter tag..."
                            {...form.register(`tags.${index}.value` as const)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeTag(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendTag({ value: '' })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Tag
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Featured
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Highlight this use case
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={create.isPending || update.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/admin/use-cases')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}