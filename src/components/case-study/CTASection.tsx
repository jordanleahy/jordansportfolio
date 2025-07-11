import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CTASectionProps {
  title: string;
}

export const CTASection = ({ title }: CTASectionProps) => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-8">{title}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="#contact">Start a Project</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/">View More Work</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};