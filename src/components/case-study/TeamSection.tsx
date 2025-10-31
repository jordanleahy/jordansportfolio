import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TeamMember } from "@/types/caseStudy";
import { iconMap } from "@/utils/iconMap";
import { ImageThumbnails } from "@/components/ui/lightbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
                  <div className="flex flex-col">
                    <Avatar className="w-12 h-12 mb-4">
                      <AvatarFallback className="bg-primary/10">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                      <h3 className="text-xl font-bold mb-2">{member.title}</h3>
                      {member.description && <p className="text-[18px] font-normal leading-[27px] tracking-[-0.18px] mb-4" style={{ color: '#000' }}>{member.description}</p>}
                      <ul className="space-y-2">
                        {member.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-sm flex items-start gap-2" style={{ color: '#000' }}>
                            <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      {member.images && member.images.length > 0 && (
                        <div className="mt-4">
                          <ImageThumbnails images={member.images} />
                        </div>
                      )}
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