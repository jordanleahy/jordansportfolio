import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TeamMember } from "@/types/caseStudy";
import { iconMap } from "@/utils/iconMap";

interface TeamSectionProps {
  teamMembers: TeamMember[];
}

export const TeamSection = ({ teamMembers }: TeamSectionProps) => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">My Role & Team</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => {
            const IconComponent = iconMap[member.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="p-8 h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col h-full">
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-4 text-foreground">{member.title}</h3>
                      {member.description && (
                        <p className="text-muted-foreground mb-6 leading-relaxed">{member.description}</p>
                      )}
                      <ul className="space-y-3">
                        {member.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-muted-foreground flex items-start gap-3 leading-relaxed">
                            <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};