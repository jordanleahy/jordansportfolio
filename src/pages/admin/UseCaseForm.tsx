import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';
import { useUseCase, useUseCaseActions, useCategories, useIndustries } from '@/hooks/useUseCases';
import type { CreateUseCase, UpdateUseCase } from '@/types/useCases';
import { toast } from 'sonner';

// Form sections
import { 
  HeroSection, 
  FigmaSection, 
  FinalProductSection, 
  ProblemSection, 
  BasicInfoSection,
  PublishingSection 
} from '@/components/admin/CaseStudyFormSections';
import { 
  TeamSection, 
  ProcessSection, 
  SolutionSection, 
  OutcomesSection, 
  ReflectionSection, 
  VisualAssetsSection 
} from '@/components/admin/CaseStudyFormAdvanced';
import { CaseStudyLayout } from '@/components/case-study/CaseStudyLayout';

const caseStudySchema = z.object({
  // Basic fields
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

  // Hero section
  hero_image: z.string().optional(),
  hero_image_alt: z.string().optional(),
  role: z.string().optional(),
  role_details: z.string().optional(),
  timeline_value: z.string().optional(),
  timeline_details: z.string().optional(),
  slug: z.string().optional(),

  // Figma integration
  figma_presentation_enabled: z.boolean().default(false),
  figma_presentation_url: z.string().optional(),
  figma_presentation_title: z.string().optional(),

  // Final product
  prototype_url: z.string().optional(),
  final_product_description: z.string().optional(),

  // Problem section
  problem_title: z.string().optional(),
  problem_description: z.string().optional(),
  challenges: z.array(z.object({
    type: z.enum(['problem', 'need']),
    title: z.string(),
    items: z.array(z.object({ value: z.string() })),
  })).default([]),

  // Team section
  team_members: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(z.object({ value: z.string() })),
  })).default([]),

  // Process section
  process_title: z.string().optional(),
  process_steps: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(z.object({ value: z.string() })).optional(),
    quote_text: z.string().optional(),
    quote_author: z.string().optional(),
    image: z.string().optional(),
  })).default([]),

  // Solution section
  solution_title: z.string().optional(),
  features: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })).default([]),

  // Outcomes section
  outcomes_title: z.string().optional(),
  user_feedback_quote: z.string().optional(),
  user_feedback_author: z.string().optional(),

  // Reflection section
  reflection_title: z.string().optional(),
  reflections: z.array(z.object({
    type: z.enum(['success', 'challenge', 'learning']),
    title: z.string(),
    items: z.array(z.object({ value: z.string() })),
  })).default([]),

  // Visual assets
  design_artifacts: z.array(z.object({ value: z.string() })).default([]),
  process_documentation: z.array(z.object({ value: z.string() })).default([]),

  // CTA
  cta_title: z.string().optional(),
});

type CaseStudyFormData = z.infer<typeof caseStudySchema>;

export default function CaseStudyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [showPreview, setShowPreview] = useState(false);

  const { data: useCase, isLoading } = useUseCase(id || '');
  const { data: categories = [] } = useCategories();
  const { data: industries = [] } = useIndustries();
  const { create, update } = useUseCaseActions();

  const form = useForm<CaseStudyFormData>({
    resolver: zodResolver(caseStudySchema),
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
      
      // Hero section defaults
      role: 'UX Designer',
      timeline_value: '6 months',
      
      // Section titles defaults
      problem_title: 'The Challenge',
      process_title: 'Design Process',
      solution_title: 'Solution & Key Features',
      outcomes_title: 'Outcomes',
      reflection_title: 'Reflection & Learnings',
      cta_title: 'Ready to discuss your project?',
      
      // Array fields
      challenges: [],
      team_members: [],
      process_steps: [],
      features: [],
      reflections: [],
      design_artifacts: [],
      process_documentation: [],
    },
  });

  useEffect(() => {
    if (useCase) {
      // Transform database data to form format
      const formData: Partial<CaseStudyFormData> = {
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

        // Hero section
        hero_image: useCase.hero_image || '',
        hero_image_alt: useCase.hero_image_alt || '',
        role: useCase.role || 'UX Designer',
        role_details: useCase.role_details || '',
        timeline_value: useCase.timeline_value || '6 months',
        timeline_details: useCase.timeline_details || '',
        slug: useCase.slug || '',

        // Figma
        figma_presentation_enabled: useCase.figma_presentation_enabled || false,
        figma_presentation_url: useCase.figma_presentation_url || '',
        figma_presentation_title: useCase.figma_presentation_title || '',

        // Final product
        prototype_url: useCase.prototype_url || '',
        final_product_description: useCase.final_product_description || '',

        // Problem
        problem_title: useCase.problem_title || 'The Challenge',
        problem_description: useCase.problem_description || '',
        challenges: useCase.challenges?.map(challenge => ({
          type: challenge.type,
          title: challenge.title,
          items: challenge.items.map(item => ({ value: item }))
        })) || [],

        // Team
        team_members: useCase.team_members?.map(member => ({
          icon: member.icon,
          title: member.title,
          description: member.description,
          items: member.items.map(item => ({ value: item }))
        })) || [],

        // Process
        process_title: useCase.process_title || 'Design Process',
        process_steps: useCase.process_steps?.map(step => ({
          icon: step.icon,
          title: step.title,
          description: step.description,
          items: step.items?.map(item => ({ value: item })) || [],
          quote_text: step.quote?.text || '',
          quote_author: step.quote?.author || '',
          image: step.image || ''
        })) || [],

        // Solution
        solution_title: useCase.solution_title || 'Solution & Key Features',
        features: useCase.features || [],

        // Outcomes
        outcomes_title: useCase.outcomes_title || 'Outcomes',
        user_feedback_quote: useCase.user_feedback?.quote || '',
        user_feedback_author: useCase.user_feedback?.author || '',

        // Reflection
        reflection_title: useCase.reflection_title || 'Reflection & Learnings',
        reflections: useCase.reflections?.map(reflection => ({
          type: reflection.type,
          title: reflection.title,
          items: reflection.items.map(item => ({ value: item }))
        })) || [],

        // Visual assets
        design_artifacts: useCase.visual_artifacts?.designArtifacts?.map(artifact => ({ value: artifact })) || [],
        process_documentation: useCase.visual_artifacts?.processDocumentation?.map(doc => ({ value: doc })) || [],

        // CTA
        cta_title: useCase.cta_title || 'Ready to discuss your project?',
      };
      
      form.reset(formData);
    }
  }, [useCase, form]);

  const onSubmit = async (data: CaseStudyFormData) => {
    try {
      // Transform form data back to database format
      const transformedData = {
        ...data,
        technical_requirements: data.technical_requirements.map(req => req.value),
        tags: data.tags.map(tag => tag.value),
        
        // Transform nested arrays
        challenges: data.challenges?.map(challenge => ({
          type: challenge.type,
          title: challenge.title,
          items: challenge.items.map(item => item.value).filter(Boolean)
        })) || [],
        
        team_members: data.team_members?.map(member => ({
          icon: member.icon,
          title: member.title,
          description: member.description,
          items: member.items.map(item => item.value).filter(Boolean)
        })) || [],
        
        process_steps: data.process_steps?.map(step => ({
          icon: step.icon,
          title: step.title,
          description: step.description,
          items: step.items?.map(item => item.value).filter(Boolean),
          quote: (step.quote_text && step.quote_author) ? {
            text: step.quote_text,
            author: step.quote_author
          } : undefined,
          image: step.image || undefined
        })) || [],
        
        reflections: data.reflections?.map(reflection => ({
          type: reflection.type,
          title: reflection.title,
          items: reflection.items.map(item => item.value).filter(Boolean)
        })) || [],
        
        user_feedback: (data.user_feedback_quote && data.user_feedback_author) ? {
          quote: data.user_feedback_quote,
          author: data.user_feedback_author
        } : null,
        
        visual_artifacts: {
          designArtifacts: data.design_artifacts?.map(artifact => artifact.value).filter(Boolean) || [],
          processDocumentation: data.process_documentation?.map(doc => doc.value).filter(Boolean) || []
        }
      };

      // Remove form-specific fields that don't exist in database
      delete (transformedData as any).user_feedback_quote;
      delete (transformedData as any).user_feedback_author;

      if (isEdit && id) {
        await update.mutateAsync({ id, ...transformedData } as UpdateUseCase);
        toast.success('Case study updated successfully');
      } else {
        await create.mutateAsync(transformedData as CreateUseCase);
        toast.success('Case study created successfully');
      }
      navigate('/admin/use-cases');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(isEdit ? 'Failed to update case study' : 'Failed to create case study');
    }
  };

  // Generate preview data for case study layout
  const generatePreviewData = () => {
    const formData = form.getValues();
    
    return {
      title: formData.title || 'Untitled Case Study',
      description: formData.description || '',
      heroImage: formData.hero_image || '',
      heroImageAlt: formData.hero_image_alt || '',
      role: formData.role || 'UX Designer',
      roleDetails: formData.role_details || '',
      timeline: formData.timeline_value || '6 months',
      timelineDetails: formData.timeline_details || '',
      tags: formData.tags?.map(tag => tag.value).filter(Boolean) || [],
      
      finalProduct: {
        title: 'Final Product',
        prototypeUrl: formData.prototype_url || '',
        description: formData.final_product_description || ''
      },
      
      figmaPresentation: formData.figma_presentation_enabled ? {
        enabled: true,
        presentationUrl: formData.figma_presentation_url || '',
        title: formData.figma_presentation_title || '',
        password: '',
        description: ''
      } : undefined,
      
      problemTitle: formData.problem_title || 'The Challenge',
      problemDescription: formData.problem_description || '',
      challenges: formData.challenges?.map(challenge => ({
        type: challenge.type,
        title: challenge.title,
        items: challenge.items.map(item => item.value).filter(Boolean)
      })) || [],
      
      teamMembers: formData.team_members?.map(member => ({
        icon: member.icon,
        title: member.title,
        description: member.description,
        items: member.items.map(item => item.value).filter(Boolean)
      })) || [],
      
      processTitle: formData.process_title || 'Design Process',
      processSteps: formData.process_steps?.map(step => ({
        icon: step.icon,
        title: step.title,
        description: step.description,
        items: step.items?.map(item => item.value).filter(Boolean),
        quote: (step.quote_text && step.quote_author) ? {
          text: step.quote_text,
          author: step.quote_author
        } : undefined,
        image: step.image
      })) || [],
      
      solutionTitle: formData.solution_title || 'Solution & Key Features',
      features: formData.features || [],
      
      outcomesTitle: formData.outcomes_title || 'Outcomes',
      userFeedback: (formData.user_feedback_quote && formData.user_feedback_author) ? {
        quote: formData.user_feedback_quote,
        author: formData.user_feedback_author
      } : undefined,
      
      reflectionTitle: formData.reflection_title || 'Reflection & Learnings',
      reflections: formData.reflections?.map(reflection => ({
        type: reflection.type,
        title: reflection.title,
        items: reflection.items.map(item => item.value).filter(Boolean)
      })) || [],
      
      visualsAndArtifacts: {
        designArtifacts: formData.design_artifacts?.map(artifact => artifact.value).filter(Boolean) || [],
        processDocumentation: formData.process_documentation?.map(doc => doc.value).filter(Boolean) || []
      },
      
      ctaTitle: formData.cta_title || 'Ready to discuss your project?'
    };
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading case study...</p>
        </div>
      </div>
    );
  }

  if (showPreview) {
    const previewData = generatePreviewData();
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setShowPreview(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Edit
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Case Study Preview</h1>
              <p className="text-muted-foreground">Preview how your case study will look</p>
            </div>
          </div>
          <Button onClick={() => setShowPreview(false)} variant="outline">
            <EyeOff className="mr-2 h-4 w-4" />
            Hide Preview
          </Button>
        </div>
        
        <CaseStudyLayout data={previewData} path="/preview" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/use-cases')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Case Study' : 'Create Case Study'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update the case study details' : 'Create a comprehensive UX case study'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Tabs defaultValue="hero" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="hero">Hero</TabsTrigger>
                  <TabsTrigger value="problem">Problem</TabsTrigger>
                  <TabsTrigger value="process">Process</TabsTrigger>
                  <TabsTrigger value="solution">Solution</TabsTrigger>
                  <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="hero" className="space-y-6">
                  <HeroSection form={form} />
                  <FigmaSection form={form} />
                  <FinalProductSection form={form} />
                </TabsContent>
                
                <TabsContent value="problem" className="space-y-6">
                  <ProblemSection form={form} />
                  <TeamSection form={form} />
                </TabsContent>
                
                <TabsContent value="process" className="space-y-6">
                  <ProcessSection form={form} />
                </TabsContent>
                
                <TabsContent value="solution" className="space-y-6">
                  <SolutionSection form={form} />
                </TabsContent>
                
                <TabsContent value="outcomes" className="space-y-6">
                  <OutcomesSection form={form} />
                  <ReflectionSection form={form} />
                  <VisualAssetsSection form={form} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <BasicInfoSection form={form} categories={categories} industries={industries} />
              <PublishingSection form={form} />
              
              <div className="flex flex-col gap-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={create.isPending || update.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? 'Update Case Study' : 'Create Case Study'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
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