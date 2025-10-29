import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ruthNacyProfile from "@/assets/ruth-nacy-profile.jpeg";
import bryanLawsonProfile from "@/assets/bryan-lawson-profile.jpeg";
import drugPriorAuthAvatar from "@/assets/bryan-lawson.jpeg";

const testimonials = [
  {
    quote: "Jordan demonstrated a methodical approach to research, user experience design, and prototyping.",
    author: "Ruth Nacey",
    role: "Director of Product, SmarterDx",
    avatar: ruthNacyProfile
  },
  {
    quote: "Jordan demonstrated a deep understanding of our users' needs and seamlessly translated complex requirements into intuitive and elegant experiences.",
    author: "Bryan Lawson",
    role: "Clinical Operations Lead",
    avatar: bryanLawsonProfile
  },
  {
    quote: "His ability to balance creativity with practicality ensured our projects not only looked exceptional but also delivered outstanding user experiences.",
    author: "Pharma Innovation",
    role: "Senior Partner & Design Director"
  },
  {
    quote: "He genuinely understands the challenges HCPs face, particularly how excessive clicks can hinder our workflow.",
    author: "Spencer Rizk DNP, APRN-CNP",
    role: "Medical Doctor",
    avatar: drugPriorAuthAvatar
  }
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 px-4 bg-muted">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-center mb-4 text-[#042F3A] text-[56px] font-medium leading-[61.6px] tracking-[0.84px]">What People Say</h2>
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
              <Card className="h-full hover:shadow-lg transition-all duration-300 border border-accent/20">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-accent mb-4" />
                  <blockquote className="font-sans text-lg mb-4 leading-relaxed text-card-foreground">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t border-accent/20 pt-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {testimonial.avatar && (
                        <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                      )}
                      <AvatarFallback className="bg-accent/10">
                        <User className="h-6 w-6 text-accent" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-sans font-semibold text-foreground">{testimonial.author}</p>
                      <p className="font-sans text-sm text-accent">{testimonial.role}</p>
                    </div>
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