import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Jordan is the rare designer who can own the research, ship the solution, and explain the ROI to stakeholders.",
    author: "Former PM, SmarterDx",
    role: "Product Manager"
  },
  {
    quote: "Jordan's ability to translate complex healthcare workflows into intuitive user experiences is exceptional.",
    author: "Design Lead, PrescriberPoint",
    role: "Design Leadership"
  },
  {
    quote: "Working with Jordan was transformative for our product team. They brought both strategic thinking and execution excellence.",
    author: "VP Product, BCG X",
    role: "VP Product"
  },
  {
    quote: "Jordan's healthcare domain expertise combined with design skills made them invaluable to our team.",
    author: "CTO, RTD Health",
    role: "Technology Leadership"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">What People Say</h2>
          <p className="text-muted-foreground text-lg">
            Feedback from colleagues and collaborators
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <blockquote className="text-lg mb-4 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;