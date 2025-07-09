import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Shield, Database, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const projects = [
  {
    id: "smarterdx",
    title: "LLM Diagnosis Dashboard",
    company: "SmarterDx",
    description: "Built an AI-powered dashboard that helps clinicians review and validate LLM-suggested diagnoses, improving clinical documentation accuracy by 40%.",
    tags: ["#RCM", "#LLM", "#ICD-10"],
    icon: Brain,
    color: "bg-blue-500",
    path: "/cases/smarterdx"
  },
  {
    id: "prescriberpoint",
    title: "ML Drug Prior Auth Tool",
    company: "PrescriberPoint",
    description: "Designed a machine learning interface that streamlines prior authorization workflows, reducing approval time from days to hours.",
    tags: ["#PriorAuth", "#ML", "#Workflow"],
    icon: Shield,
    color: "bg-green-500",
    path: "/cases/prescriberpoint"
  },
  {
    id: "bcgx",
    title: "Pharma Workflow Redesign",
    company: "BCG X",
    description: "Led the UX redesign of pharmaceutical research workflows, improving researcher productivity and reducing time-to-market for new treatments.",
    tags: ["#Pharma", "#Research", "#UX"],
    icon: Activity,
    color: "bg-purple-500",
    path: "/cases/bcgx"
  },
  {
    id: "definitive",
    title: "UI Design System + Reporting",
    company: "Definitive Healthcare",
    description: "Created a comprehensive design system and reporting interface that standardized user experience across 15+ healthcare data products.",
    tags: ["#DesignSystem", "#Analytics", "#Healthcare"],
    icon: Database,
    color: "bg-orange-500",
    path: "/cases/definitive"
  }
];

const ProjectCardsSection = () => {
  return (
    <section id="portfolio" className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Featured Projects</h2>
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
                <Card className="h-full group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${project.color}/10 mb-4`}>
                      <project.icon className={`h-6 w-6 text-white`} style={{ color: project.color.replace('bg-', '').replace('-500', '') }} />
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">{project.title}</h3>
                    <p className="text-primary font-medium">{project.company}</p>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
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