import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText, Globe, Mail } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center bg-background px-4 pt-20">
      <div className="text-center max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">
            Jordan Leahy
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-accent mb-6">
            Staff Product Designer, Healthcare RCM
          </h2>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed"
        >
          I design data-dense healthcare tools that reduce denials, improve agree rates, and make operations faster—from Figma to production, with results that scale.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button 
            size="lg" 
            className="w-full sm:w-auto"
            onClick={() => {
              const element = document.getElementById('projects');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <Globe className="mr-2 h-5 w-5" />
              View Projects
            </motion.div>
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto"
            asChild
          >
            <motion.a
              href="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//2025_Jordan%20Leahy%20Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <FileText className="mr-2 h-5 w-5" />
              Resume
            </motion.a>
          </Button>
          
          <Button 
            size="lg" 
            variant="secondary" 
            className="w-full sm:w-auto"
            onClick={() => {
              const element = document.getElementById('contact');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;