import React from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Plus, X, Upload, Image as ImageIcon, Users, Target, Lightbulb, CheckCircle, AlertCircle, BookOpen, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
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

interface CaseStudyFormData {
  // Basic fields
  title: string;
  description: string;
  category?: string;
  industry?: string;
  complexity: 'simple' | 'medium' | 'complex';
  target_audience?: string;
  business_value?: string;
  technical_requirements: Array<{ value: string }>;
  tags: Array<{ value: string }>;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  sort_order: number;

  // Hero section
  hero_image?: string;
  hero_image_alt?: string;
  role?: string;
  role_details?: string;
  timeline_value?: string;
  timeline_details?: string;

  // Figma integration
  figma_presentation_enabled?: boolean;
  figma_presentation_url?: string;
  figma_presentation_title?: string;

  // Final product
  prototype_url?: string;
  final_product_description?: string;

  // Problem section
  problem_title?: string;
  problem_description?: string;
  challenges?: Array<{
    type: 'problem' | 'need';
    title: string;
    items: Array<{ value: string }>;
  }>;

  // Team section
  team_members?: Array<{
    icon: string;
    title: string;
    description: string;
    items: Array<{ value: string }>;
  }>;

  // Process section
  process_title?: string;
  process_steps?: Array<{
    icon: string;
    title: string;
    description: string;
    items?: Array<{ value: string }>;
    quote_text?: string;
    quote_author?: string;
    image?: string;
  }>;

  // Solution section
  solution_title?: string;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;

  // Outcomes section
  outcomes_title?: string;
  user_feedback_quote?: string;
  user_feedback_author?: string;

  // Reflection section
  reflection_title?: string;
  reflections?: Array<{
    type: 'success' | 'challenge' | 'learning';
    title: string;
    items: Array<{ value: string }>;
  }>;

  // Visual assets
  design_artifacts?: Array<{ value: string }>;
  process_documentation?: Array<{ value: string }>;

  // CTA
  cta_title?: string;

  // Public URL
  slug?: string;
}

interface FormSectionProps {
  form: UseFormReturn<CaseStudyFormData>;
  categories: string[];
  industries: string[];
}

export const HeroSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Hero Section
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case Study Title</FormLabel>
              <FormControl>
                <Input placeholder="AI Sepsis Prediction System: UX Case Study..." {...field} />
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
                  placeholder="Brief description of the case study and its impact..."
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
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Role</FormLabel>
                <FormControl>
                  <Input placeholder="Senior Product Designer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeline_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeline</FormLabel>
                <FormControl>
                  <Input placeholder="6 months" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role_details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Details</FormLabel>
              <FormControl>
                <Input placeholder="End-to-end UX/UI ownership" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeline_details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timeline Details</FormLabel>
              <FormControl>
                <Input placeholder="March - May 2024" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hero_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hero Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hero_image_alt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hero Image Alt Text</FormLabel>
              <FormControl>
                <Input placeholder="Screenshot showing..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Slug</FormLabel>
              <FormControl>
                <Input placeholder="sepsis-prediction-system" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const FigmaSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  const enabled = form.watch('figma_presentation_enabled');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Figma Presentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="figma_presentation_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Enable Figma Presentation</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Display an embedded Figma presentation
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

        {enabled && (
          <>
            <FormField
              control={form.control}
              name="figma_presentation_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presentation Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Inpatient ICD-10 Primary Diagnosis Validation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="figma_presentation_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Figma Embed URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://embed.figma.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const FinalProductSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Final Product
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="prototype_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prototype URL</FormLabel>
              <FormControl>
                <Input placeholder="https://embed.figma.com/proto/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="final_product_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Interactive sepsis prediction system showcasing..."
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const ProblemSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'challenges',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Problem Definition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="problem_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem Title</FormLabel>
              <FormControl>
                <Input placeholder="The Challenge" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="problem_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the core problem and context..."
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Label>Challenges</Label>
          <div className="space-y-4 mt-2">
            {fields.map((field, index) => (
              <ChallengeField 
                key={field.id} 
                form={form} 
                index={index} 
                onRemove={() => remove(index)} 
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ type: 'problem', title: '', items: [{ value: '' }] })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Challenge
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ChallengeField = ({ form, index, onRemove }: {
  form: UseFormReturn<CaseStudyFormData>;
  index: number;
  onRemove: () => void;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `challenges.${index}.items`,
  });

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label>Challenge {index + 1}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`challenges.${index}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="problem">Problem</SelectItem>
                  <SelectItem value="need">Need</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`challenges.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Clinical Impact" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div>
        <Label>Challenge Items</Label>
        <div className="space-y-2 mt-2">
          {fields.map((itemField, itemIndex) => (
            <div key={itemField.id} className="flex gap-2">
              <Input
                placeholder="Enter challenge point..."
                {...form.register(`challenges.${index}.items.${itemIndex}.value`)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => remove(itemIndex)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ value: '' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>
    </div>
  );
};

export const BasicInfoSection = ({ form, categories, industries }: FormSectionProps) => {
  const { fields: techReqFields, append: appendTechReq, remove: removeTechReq } = useFieldArray({
    control: form.control,
    name: 'technical_requirements',
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags',
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <FormField
            control={form.control}
            name="target_audience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Audience</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Who is this case study for?"
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
                    placeholder="What business value does this case study provide?"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Requirements & Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Technical Requirements</Label>
            <div className="space-y-2 mt-2">
              {techReqFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder="Enter requirement..."
                    {...form.register(`technical_requirements.${index}.value`)}
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
                    {...form.register(`tags.${index}.value`)}
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
  );
};

export const PublishingSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing Settings</CardTitle>
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
                  Highlight this case study
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

        <FormField
          control={form.control}
          name="cta_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call-to-Action Title</FormLabel>
              <FormControl>
                <Input placeholder="Ready to discuss your project?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};