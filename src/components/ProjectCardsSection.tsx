import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Shield, Workflow, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const projects = [
  {
    id: "case1",
    title: "Pre-bill CDI Validation Dashboard",
    company: "SmarterDx",
    description: "Designed an AI-powered CDI dashboard to help CDS specialists review and validate pre-bill diagnoses.",
    tags: ["#RCM", "#LLM", "#ICD-10"],
    icon: Brain,
    color: "bg-blue-500",
    path: "/cases/case1"
  },
  {
    id: "case4",
    title: "Drug Prior Auth and Validation",
    company: "PrescriberPoint",
    description: "Designed an AI drug prior authorization workflow tool that identifies formulary rules, medical requirements, step therapy, reauthorization dates, drafts the letter, and sends to the appropriate insurance company.",
    tags: ["#PriorAuth", "#ML", "#Workflow"],
    icon: Shield,
    color: "bg-green-500",
    path: "/cases/case4"
  },
  {
    id: "case3",
    title: "Denial and Appeal Resolution",
    company: "BCG X",
    description: "Designed a denial and appeal resolution application for managing drug denials, including the drafting of templates and sending to payer.",
    tags: ["#Pharma", "#Research", "#UX"],
    icon: FileText,
    color: "bg-purple-500",
    path: "/cases/case3"
  },
  {
    id: "case2",
    title: "Clinical Ops Workflow Management for Coding and CDI",
    company: "Definitive Healthcare",
    description: "Designed a human-in-the-loop AI solution to empower clinical operations by streamlining workflow management for coding and CDI case opportunities.",
    tags: ["#DesignSystem", "#Analytics", "#Healthcare"],
    icon: Workflow,
    color: "bg-orange-500",
    path: "/cases/case2"
  }
];

const ProjectCardsSection = () => {
  return (
    <section id="projects" className="py-24 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-foreground">Featured Projects</h2>
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
              <Link to={project.path}>
                <Card className="h-full group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-accent/20 hover:border-accent">
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
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectCardsSection;