import React from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Plus, X, Users, Lightbulb, CheckCircle, AlertCircle, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
}

export const TeamSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'team_members',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team & Stakeholders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <TeamMemberField 
            key={field.id} 
            form={form} 
            index={index} 
            onRemove={() => remove(index)} 
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ 
            icon: 'Users', 
            title: '', 
            description: '', 
            items: [{ value: '' }] 
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </CardContent>
    </Card>
  );
};

const TeamMemberField = ({ form, index, onRemove }: {
  form: UseFormReturn<CaseStudyFormData>;
  index: number;
  onRemove: () => void;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `team_members.${index}.items`,
  });

  const iconOptions = ['Users', 'Target', 'Clock', 'Briefcase', 'Award', 'Code'];

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label>Team Member {index + 1}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name={`team_members.${index}.icon`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {iconOptions.map(icon => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
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
          name={`team_members.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="My Role" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`team_members.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Senior Product Designer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div>
        <Label>Responsibilities</Label>
        <div className="space-y-2 mt-2">
          {fields.map((itemField, itemIndex) => (
            <div key={itemField.id} className="flex gap-2">
              <Input
                placeholder="Enter responsibility..."
                {...form.register(`team_members.${index}.items.${itemIndex}.value`)}
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

export const ProcessSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'process_steps',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Design Process
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="process_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Process Title</FormLabel>
              <FormControl>
                <Input placeholder="Design Process" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {fields.map((field, index) => (
          <ProcessStepField 
            key={field.id} 
            form={form} 
            index={index} 
            onRemove={() => remove(index)} 
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ 
            icon: 'Search', 
            title: '', 
            description: '', 
            items: [{ value: '' }] 
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Process Step
        </Button>
      </CardContent>
    </Card>
  );
};

const ProcessStepField = ({ form, index, onRemove }: {
  form: UseFormReturn<CaseStudyFormData>;
  index: number;
  onRemove: () => void;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `process_steps.${index}.items`,
  });

  const iconOptions = ['Search', 'Users', 'Palette', 'Code', 'TestTube', 'Rocket'];

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label>Process Step {index + 1}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name={`process_steps.${index}.icon`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {iconOptions.map(icon => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
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
          name={`process_steps.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Research & Discovery" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`process_steps.${index}.image`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`process_steps.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Detailed description of this process step..."
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
          name={`process_steps.${index}.quote_text`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Quote from stakeholder..."
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`process_steps.${index}.quote_author`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote Author</FormLabel>
              <FormControl>
                <Input placeholder="Dr. Smith, Lead Physician" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {fields && (
        <div>
          <Label>Key Activities</Label>
          <div className="space-y-2 mt-2">
            {fields.map((itemField, itemIndex) => (
              <div key={itemField.id} className="flex gap-2">
                <Input
                  placeholder="Enter activity..."
                  {...form.register(`process_steps.${index}.items.${itemIndex}.value`)}
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
              Add Activity
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SolutionSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'features',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Solution & Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="solution_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solution Title</FormLabel>
              <FormControl>
                <Input placeholder="Solution & Key Features" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {fields.map((field, index) => (
          <FeatureField 
            key={field.id} 
            form={form} 
            index={index} 
            onRemove={() => remove(index)} 
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ 
            icon: 'Lightbulb', 
            title: '', 
            description: '' 
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Feature
        </Button>
      </CardContent>
    </Card>
  );
};

const FeatureField = ({ form, index, onRemove }: {
  form: UseFormReturn<CaseStudyFormData>;
  index: number;
  onRemove: () => void;
}) => {
  const iconOptions = ['Brain', 'Activity', 'TrendingUp', 'Shield', 'Users', 'Zap'];

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label>Feature {index + 1}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name={`features.${index}.icon`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {iconOptions.map(icon => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
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
          name={`features.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="AI-Powered Detection" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div /> {/* Empty div for spacing */}
      </div>

      <FormField
        control={form.control}
        name={`features.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Detailed description of the feature..."
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export const OutcomesSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Outcomes & Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="outcomes_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outcomes Title</FormLabel>
              <FormControl>
                <Input placeholder="Outcomes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="user_feedback_quote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Feedback Quote</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Quote from user or stakeholder..."
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="user_feedback_author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote Author</FormLabel>
              <FormControl>
                <Input placeholder="Lead Clinical Document Specialist. Stephen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const ReflectionSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'reflections',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Reflections & Learnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="reflection_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reflection Title</FormLabel>
              <FormControl>
                <Input placeholder="Reflection & Learnings" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {fields.map((field, index) => (
          <ReflectionField 
            key={field.id} 
            form={form} 
            index={index} 
            onRemove={() => remove(index)} 
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ 
            type: 'success', 
            title: '', 
            items: [{ value: '' }] 
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Reflection
        </Button>
      </CardContent>
    </Card>
  );
};

const ReflectionField = ({ form, index, onRemove }: {
  form: UseFormReturn<CaseStudyFormData>;
  index: number;
  onRemove: () => void;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `reflections.${index}.items`,
  });

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label>Reflection {index + 1}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`reflections.${index}.type`}
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
                  <SelectItem value="success">What Went Well</SelectItem>
                  <SelectItem value="challenge">Challenges</SelectItem>
                  <SelectItem value="learning">Next Steps</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`reflections.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="What Went Well" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div>
        <Label>Points</Label>
        <div className="space-y-2 mt-2">
          {fields.map((itemField, itemIndex) => (
            <div key={itemField.id} className="flex gap-2">
              <Input
                placeholder="Enter reflection point..."
                {...form.register(`reflections.${index}.items.${itemIndex}.value`)}
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
            Add Point
          </Button>
        </div>
      </div>
    </div>
  );
};

export const VisualAssetsSection = ({ form }: { form: UseFormReturn<CaseStudyFormData> }) => {
  const { fields: designFields, append: appendDesign, remove: removeDesign } = useFieldArray({
    control: form.control,
    name: 'design_artifacts',
  });

  const { fields: processFields, append: appendProcess, remove: removeProcess } = useFieldArray({
    control: form.control,
    name: 'process_documentation',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Visual Assets & Documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Design Artifacts</Label>
          <div className="space-y-2 mt-2">
            {designFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="Interactive Figma prototypes with clinical workflows"
                  {...form.register(`design_artifacts.${index}.value`)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeDesign(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendDesign({ value: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Design Artifact
            </Button>
          </div>
        </div>

        <div>
          <Label>Process Documentation</Label>
          <div className="space-y-2 mt-2">
            {processFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="Hospital stakeholder interview reports"
                  {...form.register(`process_documentation.${index}.value`)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeProcess(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendProcess({ value: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Documentation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};