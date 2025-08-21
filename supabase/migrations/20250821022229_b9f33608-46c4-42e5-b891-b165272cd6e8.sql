-- Insert existing use cases into the database
INSERT INTO public.use_cases (
  id,
  title,
  description,
  category,
  industry,
  complexity,
  target_audience,
  business_value,
  technical_requirements,
  tags,
  status,
  featured,
  sort_order,
  hero_image,
  hero_image_alt,
  role,
  role_details,
  timeline_value,
  timeline_details,
  figma_presentation_enabled,
  figma_presentation_url,
  figma_presentation_title,
  prototype_url,
  final_product_description,
  problem_title,
  problem_description,
  challenges,
  team_members,
  process_title,
  process_steps,
  solution_title,
  features,
  outcomes_title,
  user_feedback,
  reflection_title,
  reflections,
  visual_artifacts,
  cta_title,
  slug,
  created_at,
  updated_at
) VALUES 
-- Case 1: AI Sepsis Prediction System
(
  gen_random_uuid(),
  'AI Sepsis Prediction System: UX Case Study - Better CDI validation',
  'Designed an intelligent healthcare platform that revolutionized sepsis detection and clinical decision-making, improving patient outcomes through advanced AI-powered early warning systems.',
  'Healthcare AI',
  'Healthcare',
  'complex',
  'Healthcare professionals, clinical staff, hospital administrators',
  'Improved patient outcomes through early sepsis detection, reduced clinical workload, enhanced decision-making accuracy',
  ARRAY['AI/ML integration', 'Clinical workflow design', 'Real-time data processing', 'Mobile responsiveness', 'Accessibility compliance', 'Healthcare regulations (HIPAA)'],
  ARRAY['healthcare', 'ai', 'sepsis', 'clinical-decision-support', 'ux-design', 'patient-safety'],
  'published',
  true,
  1,
  '/lovable-uploads/4be80a48-e90b-4b76-af9c-259fe703976d.png',
  'AI Sepsis Prediction System dashboard interface',
  'Senior Product Designer',
  'Led end-to-end UX design for AI-powered sepsis detection platform',
  '6 months',
  'Full product design cycle from research to implementation',
  true,
  'https://www.figma.com/proto/example-sepsis',
  'Sepsis AI Platform Design System',
  'https://sepsis-demo.healthcare.com',
  'Comprehensive AI-powered sepsis detection platform with real-time monitoring, intelligent alerts, and clinical decision support tools.',
  'The Challenge',
  'Healthcare providers struggle with early sepsis detection, leading to delayed treatment and poor patient outcomes. Manual monitoring systems are inadequate for processing the volume and complexity of patient data required for timely intervention.',
  '[
    {
      "type": "problem",
      "title": "Business Impact",
      "items": [
        "Sepsis affects 1.7M adults annually in the US",
        "Delayed recognition increases mortality by 8% per hour", 
        "Current manual processes miss 30% of early cases",
        "Average detection time: 6-8 hours too late"
      ]
    },
    {
      "type": "need",
      "title": "Research Challenges",
      "items": [
        "Complex clinical workflows with multiple stakeholders",
        "Integration with existing EHR systems",
        "Real-time data processing requirements",
        "Balancing sensitivity vs. alert fatigue"
      ]
    }
  ]'::jsonb,
  '[
    {
      "icon": "👨‍⚕️",
      "title": "Clinical Team",
      "description": "Experienced healthcare professionals",
      "items": [
        "Dr. Sarah Johnson - Chief Medical Officer",
        "Nurse Manager Lisa Chen - Clinical Workflow Expert", 
        "Dr. Michael Rodriguez - Emergency Medicine Specialist"
      ]
    },
    {
      "icon": "💻",
      "title": "Technical Team", 
      "description": "AI and healthcare technology experts",
      "items": [
        "Alex Kim - Senior ML Engineer",
        "Jennifer Walsh - Healthcare Data Architect",
        "David Park - Full-Stack Developer"
      ]
    }
  ]'::jsonb,
  'Design Process',
  '[
    {
      "icon": "🔍",
      "title": "Discovery & Research",
      "description": "Understanding clinical workflows and user needs",
      "items": [
        "Conducted 25+ interviews with healthcare providers",
        "Observed clinical workflows in 3 hospital systems",
        "Analyzed existing sepsis detection protocols"
      ],
      "quote": {
        "text": "We need a system that enhances clinical judgment, not replaces it.",
        "author": "Dr. Sarah Johnson, Chief Medical Officer"
      }
    },
    {
      "icon": "💡", 
      "title": "Ideation & Concepts",
      "description": "Collaborative design thinking sessions",
      "items": [
        "Design thinking workshops with clinical staff",
        "Rapid prototyping of key user flows",
        "Validation of AI integration patterns"
      ]
    },
    {
      "icon": "🎨",
      "title": "Design & Prototyping", 
      "description": "Creating user-centered solutions",
      "items": [
        "Wireframing critical care pathways",
        "High-fidelity prototype development",
        "Accessibility and mobile optimization"
      ]
    },
    {
      "icon": "🔄",
      "title": "Testing & Iteration",
      "description": "Continuous refinement based on feedback",
      "items": [
        "Usability testing with 15 clinical users",
        "A/B testing of alert mechanisms",
        "Performance optimization for real-time use"
      ]
    }
  ]'::jsonb,
  'The Solution',
  '[
    {
      "icon": "🤖",
      "title": "AI-Powered Early Detection",
      "description": "Advanced machine learning algorithms analyze patient data in real-time to identify early sepsis indicators"
    },
    {
      "icon": "⚡",
      "title": "Smart Alert System", 
      "description": "Intelligent notifications that prioritize critical cases while minimizing alert fatigue for clinical staff"
    },
    {
      "icon": "📊",
      "title": "Clinical Decision Support",
      "description": "Evidence-based recommendations and treatment protocols integrated directly into existing workflows"
    },
    {
      "icon": "📱",
      "title": "Mobile-First Design",
      "description": "Responsive interface optimized for use on tablets and mobile devices throughout the hospital"
    }
  ]'::jsonb,
  'Impact & Results',
  '{
    "quote": "This system has transformed how we approach sepsis care. Detection time improved by 60% and our patient outcomes have never been better.",
    "author": "Dr. Michael Rodriguez, Emergency Medicine"
  }'::jsonb,
  'Key Learnings',
  '[
    {
      "type": "success",
      "title": "What Worked Well",
      "items": [
        "Close collaboration with clinical staff throughout design process",
        "Iterative testing with real healthcare providers",
        "Focus on workflow integration rather than disruption",
        "Balancing AI capabilities with human oversight"
      ]
    },
    {
      "type": "challenge", 
      "title": "Challenges Overcome",
      "items": [
        "Complex regulatory requirements and compliance standards",
        "Integration with legacy EHR systems", 
        "Managing alert fatigue while maintaining sensitivity",
        "Training staff on new AI-assisted workflows"
      ]
    },
    {
      "type": "learning",
      "title": "Future Improvements",
      "items": [
        "Expand AI model to predict other critical conditions",
        "Enhanced mobile experience for bedside care",
        "Integration with wearable patient monitoring devices",
        "Advanced analytics dashboard for hospital administrators"
      ]
    }
  ]'::jsonb,
  '{
    "designArtifacts": [
      "/lovable-uploads/sepsis-wireframes.png",
      "/lovable-uploads/sepsis-user-flows.png", 
      "/lovable-uploads/sepsis-design-system.png"
    ],
    "processDocumentation": [
      "/lovable-uploads/sepsis-research-findings.pdf",
      "/lovable-uploads/sepsis-usability-testing.pdf"
    ]
  }'::jsonb,
  'Ready to improve patient outcomes with intelligent healthcare design?',
  'ai-sepsis-prediction-system',
  now(),
  now()
),

-- Case 2: Denial and Appeal Resolution
(
  gen_random_uuid(),
  'Denial and Appeal Resolution',
  'Designed an AI-powered denial management platform that streamlined healthcare revenue cycle processes, reducing appeal processing time by 75% while improving approval rates.',
  'Healthcare AI',
  'Healthcare',
  'complex', 
  'Revenue cycle managers, billing specialists, healthcare administrators',
  'Reduced claim processing time, improved appeal success rates, automated routine tasks',
  ARRAY['AI automation', 'Healthcare billing systems', 'Process optimization', 'Integration APIs', 'Compliance management'],
  ARRAY['healthcare', 'revenue-cycle', 'ai-automation', 'billing', 'appeals-management'],
  'published',
  true,
  2,
  '/lovable-uploads/ed730bb1-ba72-46ce-bfa8-1a7aa1f8e60d.png',
  'Denial and Appeal Resolution platform dashboard',
  'Senior Product Designer',
  'Led UX design for AI-powered denial management platform',
  '5 months',
  'Complete redesign of denial management workflow',
  false,
  null,
  null,
  null,
  'AI-powered platform that automates denial management and appeals processing for healthcare organizations.',
  'The Problem',
  'Healthcare organizations face significant challenges with claim denials and the manual appeals process, leading to delayed payments and increased administrative costs.',
  '[
    {
      "type": "problem",
      "title": "Business Impact", 
      "items": [
        "Average denial rate: 15-20% of all claims",
        "Manual appeal process takes 30-60 days",
        "Only 65% of appeals are successful",
        "High administrative costs and staff burnout"
      ]
    },
    {
      "type": "need",
      "title": "Research Challenges",
      "items": [
        "Complex payer requirements and regulations",
        "Inconsistent denial reasoning across payers",
        "Manual document review and evidence gathering",
        "Lack of real-time status tracking"
      ]
    }
  ]'::jsonb,
  '[
    {
      "icon": "💼",
      "title": "Revenue Cycle Team",
      "description": "Healthcare billing and operations experts",
      "items": [
        "Maria Santos - Revenue Cycle Director", 
        "John Thompson - Senior Billing Specialist",
        "Amanda Lee - Compliance Manager"
      ]
    }
  ]'::jsonb,
  'Design Process',
  '[
    {
      "icon": "📋",
      "title": "Process Analysis",
      "description": "Deep dive into current denial management workflows",
      "items": [
        "Mapped existing appeal processes across 5 health systems",
        "Identified key pain points and bottlenecks",
        "Analyzed payer-specific requirements and patterns"
      ]
    },
    {
      "icon": "🎯",
      "title": "Solution Design",
      "description": "AI-powered automation strategy",
      "items": [
        "Designed intelligent appeal generation workflows",
        "Created automated evidence compilation system",
        "Developed real-time tracking and reporting features"
      ]
    },
    {
      "icon": "🔧",
      "title": "Implementation",
      "description": "Iterative development and testing",
      "items": [
        "Pilot testing with 3 healthcare organizations",
        "Continuous refinement based on user feedback", 
        "Integration with major EHR and billing systems"
      ]
    }
  ]'::jsonb,
  'The Solution',
  '[
    {
      "icon": "🤖",
      "title": "Smart Appeal Generation",
      "description": "AI automatically generates appeals with relevant clinical evidence and documentation"
    },
    {
      "icon": "📄",
      "title": "Automated Follow-up",
      "description": "System tracks appeal status and automatically follows up with payers on pending cases"
    },
    {
      "icon": "📈", 
      "title": "Analytics Dashboard",
      "description": "Real-time insights into denial patterns, success rates, and revenue recovery metrics"
    }
  ]'::jsonb,
  'Results Achieved',
  '{
    "quote": "The AI platform reduced our appeal processing time from weeks to hours. Our success rate improved to 85% and staff can focus on complex cases.",
    "author": "Maria Santos, Revenue Cycle Director"
  }'::jsonb,
  'Project Insights',
  '[
    {
      "type": "success",
      "title": "Key Successes",
      "items": [
        "75% reduction in appeal processing time",
        "20% improvement in appeal success rates", 
        "Significant reduction in manual workload",
        "Better visibility into denial patterns"
      ]
    },
    {
      "type": "challenge",
      "title": "Challenges Addressed",
      "items": [
        "Complex integration with multiple payer systems",
        "Ensuring compliance with varying regulations",
        "Training staff on new automated processes",
        "Managing change from manual to AI-assisted workflows"
      ]
    }
  ]'::jsonb,
  '{
    "designArtifacts": [
      "/lovable-uploads/denial-management-wireframes.png",
      "/lovable-uploads/appeal-workflow-diagrams.png"
    ],
    "processDocumentation": [
      "/lovable-uploads/denial-management-research.pdf"
    ]
  }'::jsonb,
  'Ready to transform your revenue cycle with AI?',
  'denial-and-appeal-resolution',
  now(),
  now()
),

-- Case 3: Drug Prior Authorization
(
  gen_random_uuid(),
  'Drug Prior Authorization',
  'Redesigned the prior authorization process for prescription medications, creating a streamlined digital workflow that reduced approval times from days to hours.',
  'Healthcare Technology',
  'Healthcare',
  'complex',
  'Healthcare providers, pharmacy staff, insurance reviewers, patients',
  'Faster medication approvals, reduced administrative burden, improved patient access to treatments',
  ARRAY['Healthcare workflows', 'API integrations', 'Mobile optimization', 'Real-time processing', 'Regulatory compliance'],
  ARRAY['prior-authorization', 'pharmacy', 'healthcare-workflow', 'medication-management', 'ux-design'],
  'published',
  true,
  3,
  '/lovable-uploads/4c976661-d94f-48e5-ab44-e69c629f2f91.png',
  'Drug Prior Authorization workflow interface',
  'Senior UX Designer', 
  'Led UX design for digital prior authorization platform',
  '6 months',
  'End-to-end redesign of medication approval process',
  false,
  null,
  null,
  null,
  'Digital platform that streamlines the prior authorization process for prescription medications through intelligent workflow automation.',
  'The Challenge',
  'The traditional prior authorization process for prescription medications is slow, complex, and creates barriers to patient care, often delaying critical treatments.',
  '[
    {
      "type": "problem",
      "title": "Current State Issues",
      "items": [
        "Average approval time: 3-7 business days",
        "60% of requests require additional documentation",
        "High abandonment rate due to complexity",
        "Significant administrative burden on providers"
      ]
    },
    {
      "type": "need",
      "title": "User Pain Points", 
      "items": [
        "Multiple disconnected systems and processes",
        "Lack of real-time status visibility",
        "Repetitive manual data entry requirements",
        "Unclear approval criteria and requirements"
      ]
    }
  ]'::jsonb,
  '[
    {
      "icon": "👩‍⚕️",
      "title": "Healthcare Providers",
      "description": "Physicians and clinical staff",
      "items": [
        "Dr. Emily Carter - Primary Care Physician",
        "Nurse Practitioner James Wilson",
        "Medical Assistant Rachel Kim"
      ]
    },
    {
      "icon": "💊",
      "title": "Pharmacy Team",
      "description": "Pharmacy and medication management experts", 
      "items": [
        "PharmD Lisa Zhang - Clinical Pharmacist",
        "Pharmacy Manager Tom Rodriguez",
        "Insurance Liaison Sarah Johnson"
      ]
    }
  ]'::jsonb,
  'Design Process',
  '[
    {
      "icon": "🎯",
      "title": "User Research",
      "description": "Understanding the current authorization journey",
      "items": [
        "Interviewed 20+ healthcare providers about PA workflows",
        "Shadowed pharmacy staff during authorization processes",
        "Analyzed insurance approval patterns and requirements"
      ]
    },
    {
      "icon": "🗺️",
      "title": "Journey Mapping",
      "description": "Mapping the complex multi-stakeholder process",
      "items": [
        "Created detailed journey maps for all user types",
        "Identified key friction points and delay causes",
        "Documented current system touchpoints and handoffs"
      ]
    },
    {
      "icon": "💡",
      "title": "Solution Design",
      "description": "Designing streamlined digital workflows",
      "items": [
        "Wireframed intelligent form systems",
        "Prototyped real-time tracking interfaces", 
        "Designed mobile-optimized provider tools"
      ]
    },
    {
      "icon": "✅",
      "title": "Validation Testing",
      "description": "Testing with real users and scenarios",
      "items": [
        "Usability testing with healthcare providers",
        "Pharmacy workflow validation sessions",
        "Insurance reviewer feedback integration"
      ]
    }
  ]'::jsonb,
  'The Solution',
  '[
    {
      "icon": "📝",
      "title": "Intelligent Forms",
      "description": "Smart forms that guide users through requirements and auto-populate from EHR data"
    },
    {
      "icon": "🔄", 
      "title": "Real-time Tracking",
      "description": "Live status updates and notifications throughout the approval process"
    },
    {
      "icon": "⚡",
      "title": "Automated Routing",
      "description": "Intelligent routing based on medication type, insurance criteria, and clinical factors"
    },
    {
      "icon": "📱",
      "title": "Mobile Access",
      "description": "Mobile-optimized interface allowing providers to submit and track requests on-the-go"
    }
  ]'::jsonb,
  'Impact & Outcomes',
  '{
    "quote": "The new system cut our approval time from days to hours. Patients get their medications faster and our staff can focus on patient care instead of paperwork.",
    "author": "Dr. Emily Carter, Primary Care Physician"
  }'::jsonb,
  'Reflections',
  '[
    {
      "type": "success",
      "title": "Major Wins",
      "items": [
        "80% reduction in average approval time",
        "50% decrease in incomplete submissions",
        "Significant improvement in provider satisfaction",
        "Better patient access to necessary medications"
      ]
    },
    {
      "type": "learning",
      "title": "Key Learnings",
      "items": [
        "Importance of cross-stakeholder collaboration in complex workflows",
        "Value of real-time communication in multi-party processes", 
        "Need for mobile-first design in healthcare settings",
        "Critical role of clear status visibility in reducing anxiety"
      ]
    }
  ]'::jsonb,
  '{
    "designArtifacts": [
      "/lovable-uploads/pa-workflow-designs.png",
      "/lovable-uploads/pa-mobile-mockups.png"
    ],
    "processDocumentation": [
      "/lovable-uploads/pa-user-research.pdf",
      "/lovable-uploads/pa-journey-maps.pdf"
    ]
  }'::jsonb,
  'Ready to streamline your authorization processes?',
  'drug-prior-authorization',
  now(), 
  now()
);