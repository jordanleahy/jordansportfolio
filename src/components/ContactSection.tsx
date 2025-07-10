import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Linkedin, Download, MapPin, Calendar } from "lucide-react";

const ContactSection = () => {
  const contactMethods = [
    {
      icon: Mail,
      label: "Email",
      value: "jordan.leahy@example.com",
      href: "mailto:jordan.leahy@example.com",
      description: "Best way to reach me"
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "linkedin.com/in/jordanleahy",
      href: "https://linkedin.com/in/jordanleahy",
      description: "Let's connect professionally"
    },
    {
      icon: Calendar,
      label: "Schedule a Call",
      value: "Book 30-minute chat",
      href: "https://calendly.com/jordanleahy",
      description: "Free consultation available"
    }
  ];

  return (
    <section id="contact" className="py-24 px-4 bg-muted">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-foreground">Let's Work Together</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            I'm always interested in new opportunities, challenging projects, and meaningful collaborations. 
            Let's discuss how we can create better healthcare experiences together.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border border-border group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{method.label}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a 
                      href={method.href} 
                      target={method.href.startsWith('http') ? '_blank' : undefined}
                      rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-sm"
                    >
                      {method.value}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="bg-background border border-border">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-accent" />
                <span className="text-muted-foreground">Boston, MA • Open to Remote</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">
                Ready to discuss your next project?
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="mailto:jordan.leahy@example.com">
                    <Mail className="mr-2 h-5 w-5" />
                    Get In Touch
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-5 w-5" />
                    Download Resume
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;