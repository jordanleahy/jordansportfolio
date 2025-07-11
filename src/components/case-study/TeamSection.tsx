import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TeamMember } from "@/types/caseStudy";
import { iconMap } from "@/utils/iconMap";

interface TeamSectionProps {
  teamMembers: TeamMember[];
}

export const TeamSection = ({ teamMembers }: TeamSectionProps) => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">My Role & Team</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => {
            const IconComponent = iconMap[member.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg mb-3 md:mb-0 w-9 h-9 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="w-full">
                      <h3 className="text-xl font-bold mb-2">{member.title}</h3>
                      {member.description && <p className="text-muted-foreground mb-4">{member.description}</p>}
                      <ul className="space-y-2">
                        {member.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                            {item}
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