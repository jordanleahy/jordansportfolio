import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Linkedin, Download, MapPin, Calendar } from "lucide-react";
import linkedinLogo from "@/assets/linkedin-logo.svg";
const ContactSection = () => {
  const contactMethods = [{
    icon: Mail,
    label: "Email",
    value: "Email",
    href: "mailto:jordanwilliamleahy@gmail.com?subject=Lets chat RCM",
    description: "Best way to reach me"
  }, {
    icon: Linkedin,
    label: "LinkedIn",
    value: "Profile",
    href: "https://linkedin.com/in/jordanleahy",
    description: "Let's connect professionally"
  }, {
    icon: Calendar,
    label: "Schedule a Call",
    value: "Book 30-minute chat",
    href: "https://calendly.com/jordanleahy",
    description: "Free consultation available"
  }];
  return <section id="contact" className="py-24 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }} viewport={{
        once: true
      }} className="text-center mb-16">
          <h2 className="text-center mb-4 text-[#042F3A] text-[56px] font-medium leading-[61.6px] tracking-[0.84px]">Let's Work Together</h2>
          <p className="text-black font-['Inter'] text-[18px] font-normal leading-[27px] tracking-[-0.18px] max-w-2xl mx-auto">
            I'm always interested in new opportunities, challenging projects, and meaningful collaborations. 
            Let's discuss how we can create better healthcare experiences together.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {contactMethods.map((method, index) => <motion.div key={method.label} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: index * 0.1
        }} viewport={{
          once: true
        }} whileHover={{
          y: -4
        }}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 border border-border group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    {method.label === "LinkedIn" ? (
                      <img src={linkedinLogo} alt="LinkedIn" className="h-6 w-6" />
                    ) : (
                      <method.icon className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-heading-sm">{method.label}</h3>
                  <p className="text-body-sm text-muted-foreground mb-3">{method.description}</p>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a 
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=jordanwilliamleahy@gmail.com&su=Lets%20chat%20RCM"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm"
                    >
                       {method.value}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>)}
        </div>

        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6,
        delay: 0.3
      }} viewport={{
        once: true
      }} className="text-center">
          <Card className="bg-background border border-border">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-accent" />
                <span className="text-muted-foreground text-body-base">New York, NY • Open to Remote</span>
              </div>
              <h3 className="text-heading-sm font-bold mb-4 text-foreground">
                Ready to discuss your next project?
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="https://mail.google.com/mail/?view=cm&fs=1&to=jordanwilliamleahy@gmail.com&su=Lets%20chat%20RCM" target="_blank" rel="noopener noreferrer">
                    <Mail className="mr-2 h-5 w-5" />
                    Get In Touch
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//2025_Jordan%20Leahy%20Resume.pdf" target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-5 w-5" />
                    Download Resume
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>;
};
export default ContactSection;