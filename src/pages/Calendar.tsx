import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { PostForm } from '@/components/calendar/PostForm';
import { PostsTable } from '@/components/calendar/PostsTable';
import { JsonImportDialog } from '@/components/calendar/JsonImportDialog';
import { socialMediaService } from '@/services/socialMediaService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import type { SocialMediaPost } from '@/types/socialMedia';

type CategoryType = 'cdi' | 'contracts' | 'forms' | 'coding ai';

export default function Calendar() {
  const [postsByCategory, setPostsByCategory] = useState<Record<string, SocialMediaPost[]>>({});
  const [availableCategories, setAvailableCategories] = useState<CategoryType[]>(['cdi', 'contracts']);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState<CategoryType>('cdi');
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadAllPosts();
        } else {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAllPosts();
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllCategories = async () => {
    try {
      const categories = await socialMediaService.getAvailableCategories();
      const allCategories = ['cdi', 'contracts', 'coding ai', ...categories.filter(c => c !== 'cdi' && c !== 'contracts' && c !== 'coding ai')] as CategoryType[];
      setAvailableCategories(allCategories);
      
      // Load posts for all categories
      const postsData: Record<string, SocialMediaPost[]> = {};
      for (const category of allCategories) {
        const posts = await socialMediaService.getAllPosts(category as any);
        postsData[category] = posts;
      }
      setPostsByCategory(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllPosts = async () => {
    await loadAllCategories();
    
    // Check if coding ai category needs data and add it
    const codingAiPosts = await socialMediaService.getAllPosts('coding ai' as any);
    if (codingAiPosts.length === 0) {
      await addCodingAiData();
    }
  };

  const addCodingAiData = async () => {
    const codingAiData = [
      {
        day: 1,
        title: "Autonomous Coding Has Arrived",
        description: "AI is set to take over the repetitive work of medical coding, turning a labor-intensive process into a continuous, automated workflow. Industry experts note that fully autonomous coding is \"the clear direction of travel\" for healthcare, given the persistent shortage of coders and high administrative costs. This bold shift promises to eliminate reliance on offshore coding labor while boosting efficiency and accuracy across U.S. inpatient and outpatient settings.",
        theme: "autonomous coding"
      },
      {
        day: 2,
        title: "Instant Codes from Clinical Text",
        description: "Today's medical coders often sift through 50,000 words (half a novel) in a single patient record – only to distill it into about 19 billing codes chosen from 140,000+ possibilities. They repeat this tedious task multiple times an hour. AI sees this massive reading and coding workload as a bottleneck begging for automation. By leveraging natural language processing to understand clinical text, AI can instantly interpret documentation and output the proper CPT and ICD-10 codes, transforming hours of human work into seconds of processing.",
        theme: "autonomous coding"
      },
      {
        day: 3,
        title: "Coding in Real-Time, Not Afterward",
        description: "Continuous coding is on the horizon: AI systems will code medical encounters in real-time as care is delivered, rather than days or weeks later. In both inpatient hospital stays and outpatient visits, AI-driven coding engines can parse clinical notes and assign codes within seconds of documentation. This real-time approach means billing processes start immediately, reducing backlogs and enabling healthcare providers to get reimbursed faster. The vision: no more end-of-day or end-of-week coding batches – just immediate, autonomous coding after each encounter.",
        theme: "autonomous coding"
      },
      {
        day: 4,
        title: "No More Offshore Coders",
        description: "U.S. healthcare providers have long relied on offshore teams for manual coding, but AI will bring coding back onshore (and in-house) digitally. By automating repetitive coding tasks with high accuracy, hospitals can reduce or eliminate outsourcing agreements. Not only does this cut costs, it also addresses labor shortages at home. AI coding engines work 24/7 without fatigue, meaning health systems can achieve round-the-clock coding without chasing offshore labor pools.",
        theme: "autonomous coding"
      },
      {
        day: 5,
        title: "Let AI Handle the Repetitive Stuff",
        description: "Routine cases like normal X-rays, lab tests, or standard check-ups are repetitive and ripe for automation. Today, expert coders spend valuable time on such mundane tasks, but AI can handle them instantly. By training AI on the most common scenarios, every repetitive coding task can be done via a standardized prompt to an AI model. This frees human coders to focus on complex, edge-case scenarios.",
        theme: "autonomous coding"
      },
      {
        day: 6,
        title: "A Prompt for Every Code",
        description: "Imagine an AI \"codec\" that knows every medical code by prompt. In the near future, clinicians or coders might simply describe the procedure or diagnosis in natural language, and an AI agent will return the exact CPT code or ICD-10 code – effectively one perfect prompt for every billable item.",
        theme: "autonomous coding"
      },
      {
        day: 7,
        title: "LLMs Beat Human Coders Now",
        description: "The AI revolution in coding has arrived thanks to large language models (LLMs). Before advanced LLMs, coding automation tech often fell short of human accuracy. But post-GPT advancements, AI models are now matching – even beating – human coders in accuracy and speed.",
        theme: "autonomous coding"
      },
      {
        day: 8,
        title: "AI Improves Coding Accuracy",
        description: "Medical coding is prone to human error, from typos to missed codes, but AI is dramatically improving accuracy. Cutting-edge autonomous coding engines have demonstrated over 95% accuracy in assigning codes, outperforming typical manual coding benchmarks.",
        theme: "autonomous coding"
      },
      {
        day: 9,
        title: "5x Faster Coding Throughput",
        description: "AI isn't just a little faster at coding – it's orders of magnitude faster. One AI-powered solution achieved a 5–7× productivity boost in coding tasks. What a human coder might do in an hour, AI can potentially do in minutes or seconds.",
        theme: "autonomous coding"
      },
      {
        day: 10,
        title: "Big Savings for CFOs and Investors",
        description: "The financial impact of AI-driven coding automation is enormous. By slashing labor costs and increasing accuracy, AI can cut coding-related costs by up to 35% for providers. Fewer errors also mean fewer denied claims.",
        theme: "autonomous coding"
      },
      {
        day: 11,
        title: "Slash Denials, Boost Revenue",
        description: "AI-based coding doesn't just save money on labor; it can increase revenue by coding more completely and correctly. Hospitals using autonomous coding engines have seen claims denial rates drop by up to 50%.",
        theme: "autonomous coding"
      },
      {
        day: 12,
        title: "Faster Cash Flow with AI Coding",
        description: "AI coding significantly speeds up reimbursement cycles. By automating coding, organizations have cut 5+ days off their Accounts Receivable (A/R) times on average. The result is not only more revenue captured, but also more reliable data.",
        theme: "autonomous coding"
      },
      {
        day: 13,
        title: "Built-In Compliance, Always On",
        description: "AI coding systems are being built with compliance and auditability at their core. Every code an AI assigns can be linked back to the source documentation and the algorithm's reasoning, creating an audit trail far more detailed than a human's.",
        theme: "autonomous coding"
      },
      {
        day: 14,
        title: "Less Paperwork, More Patient Time",
        description: "By offloading routine coding to machines, healthcare professionals – from doctors to human coders – can refocus on what matters most: patient care. Even professional coders benefit, as their role shifts from mind-numbing data entry to supervising AI outputs.",
        theme: "autonomous coding"
      },
      {
        day: 15,
        title: "Inpatient + Outpatient = One Engine",
        description: "AI coding tools are versatile and can bridge the gap between inpatient and outpatient coding. This means a single AI platform could handle coding for a patient's entire journey, ensuring uniform standards.",
        theme: "autonomous coding"
      },
      {
        day: 16,
        title: "Investors Back the Future of Coding",
        description: "Venture capital is pouring into AI-driven coding startups, signaling strong confidence in this transformation. In 2024–2025, funding for AI health companies has surged – with autonomous coding platforms raising significant rounds.",
        theme: "autonomous coding"
      },
      {
        day: 17,
        title: "Meet the AI Coding Pioneers",
        description: "A new cohort of startups is leading the charge to make autonomous coding a reality. Companies like Nym Health, Fathom, and AKASA are deploying at scale, creating an arms race of innovation.",
        theme: "autonomous coding"
      },
      {
        day: 18,
        title: "200,000 Coders = Opportunity",
        description: "In the U.S., over 200,000 medical coders still manually process charts. This has become a bottleneck in healthcare operations, with frequent backlogs and errors. Investors see a classic disruption scenario.",
        theme: "autonomous coding"
      },
      {
        day: 19,
        title: "AI in Epic and Everywhere Else",
        description: "Health systems are beginning to embrace AI coding solutions, integrating them with electronic health records. Epic now has a category for Fully Autonomous Coding tools.",
        theme: "autonomous coding"
      },
      {
        day: 20,
        title: "Yes, Insurers Will Accept It",
        description: "A key stakeholder in the coding revolution is the payer. The good news: payers are chiefly concerned with accuracy and compliance, and AI is delivering on those fronts.",
        theme: "autonomous coding"
      },
      {
        day: 21,
        title: "Solving the Talent Shortage",
        description: "The coding profession has been facing a 30% talent shortage nationwide. AI presents a solution: acting as a force multiplier for the existing workforce.",
        theme: "autonomous coding"
      },
      {
        day: 22,
        title: "Coders Become AI Auditors",
        description: "Rather than making human coders obsolete, AI is changing their roles. Think 'coder 2.0': professionals who oversee AI outputs, handle complex cases, and continually train/improve the AI models.",
        theme: "autonomous coding"
      },
      {
        day: 23,
        title: "Tackling Privacy and Trust Issues",
        description: "For AI coding, a major concern is data privacy and security. These AI systems must handle sensitive patient information, so they need robust safeguards to prevent breaches.",
        theme: "autonomous coding"
      },
      {
        day: 24,
        title: "Regulators Are Catching Up",
        description: "U.S. regulators and industry bodies are beginning to acknowledge and guide the use of AI in administrative healthcare tasks. The policy environment is gradually aligning to support AI innovations.",
        theme: "autonomous coding"
      },
      {
        day: 25,
        title: "Training the Coders of the Future",
        description: "Training an AI coder involves feeding it vast numbers of clinical notes and their correct codes, so it learns the patterns. Fortunately, years of electronic health records provide a rich training ground.",
        theme: "autonomous coding"
      },
      {
        day: 26,
        title: "AI Owns Radiology. Next: Everything",
        description: "One of the first domains to see AI coding success is radiology. But it doesn't stop there – specialties like emergency medicine, surgery, and even complex inpatient cases are on the AI radar.",
        theme: "autonomous coding"
      },
      {
        day: 27,
        title: "Beyond Coding: Full RCM Automation",
        description: "Autonomous coding is a cornerstone, but it's part of a larger trend of AI optimizing the entire revenue cycle management (RCM). The end game is a largely self-driving revenue cycle.",
        theme: "autonomous coding"
      },
      {
        day: 28,
        title: "5 Years to Full AI Adoption",
        description: "Change is coming fast. Many hospitals are already in pilot phases or partial deployments. Within 5 years, a majority of U.S. health systems will have autonomous or AI-augmented coding.",
        theme: "autonomous coding"
      },
      {
        day: 29,
        title: "Destroying Administrative Waste",
        description: "The shift to AI coding is part of a broader vision to eliminate wasteful administrative overhead in healthcare. Roughly a quarter of U.S. healthcare spending goes to admin functions.",
        theme: "autonomous coding"
      },
      {
        day: 30,
        title: "Lead the Revolution Now",
        description: "We conclude the 30-day journey with a call to action: embrace AI-driven coding. The vision of \"a single prompt for every code\" is not science fiction; it's an emerging reality.",
        theme: "autonomous coding"
      }
    ];

    try {
      await socialMediaService.bulkImportPosts('coding ai', codingAiData);
      toast({
        title: "Coding AI Content Added",
        description: "Successfully added 30 coding AI posts to your calendar.",
      });
    } catch (error) {
      console.error('Error adding coding AI data:', error);
    }
  };

  const loadCategoryPosts = async (category: CategoryType) => {
    try {
      const posts = await socialMediaService.getAllPosts(category as any);
      setPostsByCategory(prev => ({
        ...prev,
        [category]: posts
      }));
    } catch (error) {
      console.error(`Error loading ${category} posts:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${category} posts.`,
        variant: "destructive",
      });
    }
  };

  const handleImportComplete = async () => {
    await loadAllCategories();
    toast({
      title: "Categories Updated",
      description: "Available categories have been refreshed after import.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-20 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Social Media Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your social media content for LinkedIn and other platforms.
          </p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div></div>
          <JsonImportDialog onImportComplete={handleImportComplete} />
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as CategoryType)} 
          className="space-y-8"
        >
          <TabsList className={`grid w-full grid-cols-${availableCategories.length}`}>
            {availableCategories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableCategories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-8">
              <PostForm 
                onPostCreated={() => loadCategoryPosts(category)} 
                category={category as any} 
              />
              <PostsTable 
                posts={postsByCategory[category] || []} 
                onPostsChange={() => loadCategoryPosts(category)} 
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}