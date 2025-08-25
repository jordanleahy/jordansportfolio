import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Shield, Workflow, FileText } from "lucide-react";
import { CaseStudyPasswordModal } from "@/components/case-study/CaseStudyPasswordModal";
import { useCaseStudyAuth } from "@/hooks/useCaseStudyAuth";

const projects = [
  {
    id: "case1",
    title: "Inpatient Revenue Cycle Management",
    company: "Healthcare Analytics",
    description: "Designed an AI powered CDI dashboard to help CDS specialists review and validate new primary diagnoses.",
    tags: ["#RCM", "#LLM", "#ICD-10"],
    icon: Brain,
    color: "bg-blue-500",
    path: "/cases/case1"
  },
  {
    id: "case4",
    title: "Drug Prior Auth and Validation",
    company: "Digital Health Platform",
    description: "Designed an AI drug prior authorization workflow tool that identifies formulary rules, medical requirements, step therapy, reauthorization dates, drafts the letter, and sends to the appropriate insurance company.",
    tags: ["#PriorAuth", "#ML", "#Workflow"],
    icon: Shield,
    color: "bg-green-500",
    path: "/cases/case4"
  },
  {
    id: "case3",
    title: "Denial and Appeal Resolution",
    company: "Revenue Cycle Solutions",
    description: "Designed a denial and appeal resolution application for managing denials, including the drafting of templates and sending to payer.",
    tags: ["#Appeals", "#Research", "#UX"],
    icon: FileText,
    color: "bg-purple-500",
    path: "/cases/case3"
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
      <section id="case-studies" className="py-24 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-foreground">Case Studies</h2>
            <p className="text-muted-foreground text-lg">
              Case studies showcasing healthcare design innovation
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, rotate: -1 }}
              >
                <Card 
                  className="h-full group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-accent/20 hover:border-accent"
                  onClick={() => handleCaseStudyNavigation(project.path)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-lg bg-accent/10 mb-4">
                        <project.icon className="h-6 w-6 text-accent" />
                      </div>
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-foreground">{project.title}</h3>
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
                          <p className="text-white text-sm font-medium text-center px-4">
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
                           <p className="text-white text-sm font-medium text-center px-4">
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
                  
                  <CardContent className="pt-0">
                    <p className="text-card-foreground mb-4 leading-relaxed">
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="font-mono text-xs bg-primary text-primary-foreground tracking-wide">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      View Case Study
                      <ArrowRight className="ml-2 h-4 w-4" />
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
