import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText, Globe, Mail } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
      <div className="text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Jordan Leahy
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-muted-foreground mb-6">
            Healthcare Product Designer & Strategist
          </h2>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          Designing automation tools for clinical integrity, revenue recovery, and safer care.
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
            asChild
          >
            <motion.a
              href="#resume"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="mr-2 h-5 w-5" />
              Resume
            </motion.a>
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto"
            asChild
          >
            <motion.a
              href="#portfolio"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Globe className="mr-2 h-5 w-5" />
              Portfolio
            </motion.a>
          </Button>
          
          <Button 
            size="lg" 
            variant="secondary" 
            className="w-full sm:w-auto"
            asChild
          >
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact
            </motion.a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;