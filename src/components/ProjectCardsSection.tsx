import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Shield, Workflow, FileText, Activity, Layout } from "lucide-react";
import { CaseStudyPasswordModal } from "@/components/case-study/CaseStudyPasswordModal";
import { useCaseStudyAuth } from "@/hooks/useCaseStudyAuth";
import smarterdxLogo from "@/assets/smarterdx-logo.png";
import prescriberPointLogo from "@/assets/prescriberpoint-logo.png";
import definitiveHealthcareLogo from "@/assets/definitive-healthcare-logo.png";

const projects = [
  {
    id: "case1",
    title: "Achieved 60% diagnostic accuracy improvement",
    company: "Healthcare Analytics",
    description: "Designed an AI powered CDI dashboard to help CDS specialists review and validate new primary diagnoses.",
    tags: ["#RCM", "#LLM", "#ICD-10"],
    icon: Brain,
    path: "/cases/case1",
    impact: {
      metric: "60%",
      label: "Accuracy Improvement"
    },
    role: "Lead Product Designer",
    timeline: "6 months"
  },
  {
    id: "case2",
    title: "I reduced clinical note review time by 8 minutes.",
    company: "Healthcare EMR Solutions",
    description: "Inpatient EMR notes are essential for assigning the correct ICD-10 codes but they are often \"duplicates\" or \"copy and pasted\" making it hard for systems and humans to assign the right codes.",
    tags: ["#EMR", "#Notes", "#ICD-10", "#Duplicates", "#MetabolicEncephalopathy", "#UnstructuredNotes"],
    icon: FileText,
    path: "/cases/case2",
    impact: {
      metric: "8 min",
      label: "Time Saved per Review"
    },
    role: "Product Designer",
    timeline: "4 months"
  },
  {
    id: "case4",
    title: "Led product growth from launch to 200K users",
    company: "Digital Health Platform",
    description: "Designed an AI drug prior authorization workflow tool that identifies formulary rules, medical requirements, step therapy, reauthorization dates, drafts the letter, and sends to the appropriate insurance company.",
    tags: ["#PriorAuth", "#ML", "#Workflow", "#Formulary", "#Denials", "#StepTherapy", "#AppealLetter"],
    icon: Shield,
    path: "/cases/case4",
    impact: {
      metric: "200K+",
      label: "Active Users"
    },
    role: "Lead Product Designer",
    timeline: "18 months"
  },
  {
    id: "case6",
    title: "Transformed 3M page views from chaos to clarity",
    company: "Healthcare Data Analytics",
    description: "Led a data-driven redesign to transform navigation chaos into clarity. Partnered with Product Management, Customer Success, and Data Science to restructure information architecture, streamline workflows, and reduce user effort across a product receiving 3 million annual page views.",
    tags: ["#DataDriven", "#UX", "#Navigation", "#InformationArchitecture", "#Workflow"],
    icon: Layout,
    path: "/cases/case6",
    impact: {
      metric: "3M+",
      label: "Annual Page Views"
    },
    role: "Senior Product Designer",
    timeline: "12 months"
  }
];

const ProjectCardsSection = () => {
  const { 
    showPasswordModal, 
    handleCaseStudyNavigation, 
    handleAuthentication, 
    handleCloseModal 
  } = useCaseStudyAuth();

  return (
    <>
      <section id="case-studies" className="py-32 px-4 relative overflow-hidden bg-[#074141]">
        {/* Topographic Contour Lines Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
            <path d="M0,100 Q250,120 500,100 T1000,100 T1500,100 T2000,100" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
            <path d="M0,180 Q200,200 400,180 T800,180 T1200,180 T1600,180 T2000,180" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
            <path d="M0,250 Q300,230 600,250 T1200,250 T1800,250 T2000,250" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
            <path d="M0,320 Q220,340 440,320 T880,320 T1320,320 T1760,320 T2000,320" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
            <path d="M0,400 Q280,380 560,400 T1120,400 T1680,400 T2000,400" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
            <path d="M0,480 Q240,500 480,480 T960,480 T1440,480 T1920,480 T2000,480" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
            <path d="M0,560 Q320,540 640,560 T1280,560 T1920,560 T2000,560" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
            <path d="M0,640 Q180,660 360,640 T720,640 T1080,640 T1440,640 T1800,640 T2000,640" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
            <path d="M0,720 Q260,700 520,720 T1040,720 T1560,720 T2000,720" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
            <path d="M0,800 Q210,820 420,800 T840,800 T1260,800 T1680,800 T2000,800" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-block mb-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                <span className="text-body-sm font-medium text-white">Featured Work</span>
              </div>
            </motion.div>
            <h2 className="text-center mb-6 text-white text-[56px] font-medium leading-[61.6px] tracking-[0.84px]">Case Studies</h2>
            <p className="text-white text-center text-[18px] font-normal leading-[27px] tracking-[-0.18px] max-w-2xl mx-auto">
              Deep dives into healthcare design challenges and solutions
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -12 }}
              >
                <Card 
                  className={`h-full group relative overflow-hidden transition-all duration-500 border-2 hover:shadow-custom-2xl ${
                    project.id === 'case3' ? 'cursor-default border-border' : 'cursor-pointer border-accent/10 hover:border-accent/50'
                  }`}
                  onClick={project.id === 'case3' ? undefined : () => handleCaseStudyNavigation(project.path)}
                >
                  {/* Gradient overlay on hover */}
                  {project.id !== 'case3' && (
                    <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  )}
                  <CardHeader className="pb-4 relative z-10">
                    {/* Impact Badge */}
                    {project.impact && (
                      <div className="mb-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                          <span className="text-primary font-bold text-sm">{project.impact.metric}</span>
                          <span className="text-primary/70 text-xs">{project.impact.label}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        className="p-3"
                      >
                        {project.id === 'case1' ? (
                          <img src={smarterdxLogo} alt="SmarterDx Logo" className="h-6 w-auto" />
                        ) : project.id === 'case4' ? (
                          <img src={prescriberPointLogo} alt="PrescriberPoint Logo" className="h-6 w-auto" />
                        ) : project.id === 'case6' ? (
                          <img src={definitiveHealthcareLogo} alt="Definitive Healthcare Logo" className="h-6 w-auto" />
                        ) : (
                          <project.icon className="h-6 w-6 text-accent" />
                        )}
                      </motion.div>
                      <motion.div
                        whileHover={{ x: 6, scale: 1.2 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="font-['Inter'] text-[24px] font-medium leading-[31.2px] mb-2 text-black">{project.title}</h3>
                      {/* Role and Timeline */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="font-medium">{project.role}</span>
                        <span>•</span>
                        <span>{project.timeline}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {project.id === "case1" && (
                    <div className="px-6 pb-4">
                      <div className="relative group/image">
                        <img 
                          src="/case1-updated.png"
                          alt="Healthcare encounter interface showing diagnosis codes, patient information, and clinical decision support workflow"
                          className="w-full aspect-video object-cover rounded-lg border border-border/50"
                          key="case1-image-v3"
                        />
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-body-sm font-medium text-center px-4">
                            Click and enter password for case details
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {project.id === "case2" && (
                    <div className="px-6 pb-4">
                      <div className="relative group/image">
                        <img 
                          src="/lovable-uploads/3b1ac111-f65f-41c5-ba02-e27142d30d31.png"
                          alt="Clinical decision support interface showing encounter notes, diagnosis codes, and ICD-10 coding suggestions for metabolic encephalopathy and other conditions"
                          className="w-full aspect-video object-cover rounded-lg border border-border/50"
                        />
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-body-sm font-medium text-center px-4">
                            Click and enter password for case details
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {project.id === "case4" && (
                     <div className="px-6 pb-4">
                       <div className="relative group/image">
                         <img 
                            src="/case4-prescriber-point.png"
                            alt="Drug Prior Authorization interface showing workflow steps"
                            className="w-full aspect-video object-cover rounded-lg border border-border/50"
                            key="case4-image-v2"
                          />
                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                            <p className="text-white text-body-sm font-medium text-center px-4">
                              Click and enter password for case details
                            </p>
                          </div>
                       </div>
                     </div>
                  )}
                  
                  {project.id === "case3" && (
                    <div className="px-6 pb-4">
                      <img 
                        src="/lovable-uploads/ed730bb1-ba72-46ce-bfa8-1a7aa1f8e60d.png"
                        alt="Denial and Appeal Resolution interface showing appeal management workflow"
                        className="w-full aspect-video object-cover rounded-lg border border-border/50"
                      />
                    </div>
                  )}
                  
                  {project.id === "case6" && (
                    <div className="px-6 pb-4">
                      <div className="relative group/image">
                        <img 
                          src="/case6-definitive-healthcare.png"
                          alt="Definitive Healthcare dashboard showing multi-device interface with navigation, data analytics, and clinical metrics"
                          className="w-full aspect-video object-cover rounded-lg border border-border/50"
                          key="case6-image-v2"
                        />
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-body-sm font-medium text-center px-4">
                            Click and enter password for case details
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="pt-0 relative z-10">
                    <p className="text-card-foreground mb-6 leading-relaxed text-body-base flex flex-col items-start self-stretch">
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-8">
                      {project.tags.map((tag, tagIndex) => (
                        <motion.div
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + tagIndex * 0.05 }}
                          viewport={{ once: true }}
                        >
                          <Badge 
                            variant="secondary" 
                            className="font-mono text-caption bg-gradient-to-r from-primary to-primary/80 text-primary-foreground tracking-wide hover:shadow-accent-sm transition-shadow duration-300"
                          >
                            {tag}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full group/btn hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300" 
                      disabled={project.id === 'case3'}
                    >
                      {project.id === 'case3' ? 'Available on Tuesday, Sep 15, 2025' : 'View Case Study'}
                      {project.id !== 'case3' && <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <CaseStudyPasswordModal
        isOpen={showPasswordModal}
        onClose={handleCloseModal}
        onAuthenticate={handleAuthentication}
      />
    </>
  );
};

export default ProjectCardsSection;
