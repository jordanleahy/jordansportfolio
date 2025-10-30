import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Globe, Sparkles } from "lucide-react";

const HeroSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 pt-20 bg-white">
      {/* Enhanced background with gradients */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Floating badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 shadow-accent-sm mb-8"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-body-sm font-medium text-accent">Staff Product Designer, Healthcare RCM</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-display-lg md:text-display-2xl font-bold mb-8"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-accent to-foreground">
            Jordan Leahy
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-body-lg md:text-heading-md text-muted-foreground mb-16 max-w-4xl mx-auto"
        >
          I design data-dense healthcare tools that reduce denials, improve agree rates, and make operations faster—from Figma to production, with results that scale.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-6"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={() => scrollToSection("projects")}
              className="text-body-lg px-10 py-7 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent shadow-accent-md hover:shadow-accent-lg transition-all duration-300 flex items-center gap-2"
            >
              <Globe className="h-5 w-5" />
              View Projects
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-body-lg px-10 py-7 border-2 hover:border-accent hover:bg-accent/5 hover:shadow-accent-sm transition-all duration-300"
            >
              <a
                href="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//2025_Jordan%20Leahy%20Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Resume
              </a>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              variant="secondary"
              onClick={() => scrollToSection("contact")}
              className="text-body-lg px-10 py-7 hover:bg-secondary/80 transition-all duration-300 flex items-center gap-2"
            >
              <Mail className="h-5 w-5" />
              Contact
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
