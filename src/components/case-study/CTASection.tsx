import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CTASectionProps {
  title: string;
  contactText?: string;
  portfolioText?: string;
}

export const CTASection = ({ 
  title, 
  contactText = "Get in Touch",
  portfolioText = "View More Projects"
}: CTASectionProps) => {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-6">{title}</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <a href="mailto:?subject=Jordan%20Intro">{contactText}</a>
          </Button>
          <Link to="/">
            <Button variant="outline" size="lg">
              {portfolioText}
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};