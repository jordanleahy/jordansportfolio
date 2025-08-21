import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CTASectionProps {
  title: string;
}

export const CTASection = ({ title }: CTASectionProps) => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-foreground">{title}</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" className="text-lg px-8 py-4 h-auto" asChild>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=jordanwilliamleahy@gmail.com&su=Project%20Inquiry" target="_blank" rel="noopener noreferrer">
                Start a Project
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto" asChild>
              <Link to="/">View More Work</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};