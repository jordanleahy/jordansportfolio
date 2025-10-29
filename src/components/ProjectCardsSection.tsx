import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Shield, Workflow, FileText, Activity } from "lucide-react";
import { CaseStudyPasswordModal } from "@/components/case-study/CaseStudyPasswordModal";
import { useCaseStudyAuth } from "@/hooks/useCaseStudyAuth";

const projects = [
  {
    id: "case1",
    title: "I improved clinical primary diagnosis by 60% through dense clinical design & storytelling",
    company: "Healthcare Analytics",
    description: "Designed an AI powered CDI dashboard to help CDS specialists review and validate new primary diagnoses.",
    tags: ["#RCM", "#LLM", "#ICD-10"],
    icon: Brain,
    path: "/cases/case1"
  },
  {
    id: "case2",
    title: "I reduced clinical note review time by 8 minutes.",
    company: "Healthcare EMR Solutions",
    description: "Inpatient EMR notes are essential for assigning the correct ICD-10 codes but they are often \"duplicates\" or \"copy and pasted\" making it hard for systems and humans to assign the right codes.",
    tags: ["#EMR", "#Notes", "#ICD-10", "#Duplicates", "#MetabolicEncephalopathy", "#UnstructuredNotes"],
    icon: FileText,
    path: "/cases/case2"
  },
  {
    id: "case4",
    title: "Drug Prior Auth and Validation",
    company: "Digital Health Platform",
    description: "Designed an AI drug prior authorization workflow tool that identifies formulary rules, medical requirements, step therapy, reauthorization dates, drafts the letter, and sends to the appropriate insurance company.",
    tags: ["#PriorAuth", "#ML", "#Workflow", "#Formulary", "#Denials", "#StepTherapy", "#AppealLetter"],
    icon: Shield,
    path: "/cases/case4"
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
      <section id="case-studies" className="py-32 px-4 relative overflow-hidden">
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
                <span className="text-body-sm font-medium text-accent">Featured Work</span>
              </div>
            </motion.div>
            <h2 className="text-center mb-6 text-[#042F3A] text-[56px] font-medium leading-[61.6px] tracking-[0.84px]">Case Studies</h2>
            <p className="text-muted-foreground text-body-lg max-w-2xl mx-auto">
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
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 shadow-accent-sm"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <project.icon className="h-6 w-6 text-accent" />
                      </motion.div>
                      <motion.div
                        whileHover={{ x: 6, scale: 1.2 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="text-heading-md font-bold mb-2 text-foreground leading-tight group-hover:text-accent transition-colors duration-300">{project.title}</h3>
                    </div>
                  </CardHeader>
                  
                  {project.id === "case1" && (
                    <div className="px-6 pb-4">
                      <div className="relative group/image">
                        <img 
                          src="/lovable-uploads/94645942-c8fe-4408-a81b-37d80b01c845.png"
                          alt="Healthcare encounter interface showing diagnosis codes, patient information, and clinical decision support workflow"
                          className="w-full aspect-video object-cover rounded-lg border border-border/50 blur-[1px]"
                          key="case1-image-updated"
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
                          className="w-full aspect-video object-cover rounded-lg border border-border/50 blur-[1px]"
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
                           src="/lovable-uploads/866199b0-8a85-4f7b-957a-f215fd29176b.png"
                           alt="Drug Prior Authorization interface showing workflow steps"
                           className="w-full aspect-video object-cover rounded-lg border border-border/50 blur-[1px]"
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
                  
                  <CardContent className="pt-0 relative z-10">
                    <p className="text-card-foreground mb-6 leading-relaxed text-body-base">
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
