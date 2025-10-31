import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TeamMember } from "@/types/caseStudy";
import { iconMap } from "@/utils/iconMap";
import { ImageThumbnails } from "@/components/ui/lightbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import jordanHeadshot from "@/assets/jordan-headshot.jpeg";
import joshHeadshot from "@/assets/josh-headshot.png";
import ruthHeadshot from "@/assets/ruth-headshot.png";
import scottHeadshot from "@/assets/scott-headshot.png";

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
                    {member.title === "Team & Stakeholders" ? (
                      <div className="flex -space-x-2 mb-4">
                        {member.items.slice(0, 5).map((item, i) => (
                          i === 0 ? (
                            <a 
                              key={i} 
                              href="https://www.linkedin.com/in/josh-geleris/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:z-10 transition-transform hover:scale-110"
                            >
                              <Avatar className="w-12 h-12 border-2 border-background">
                                <AvatarImage src={joshHeadshot} alt="Josh Geleris" />
                                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                  JG
                                </AvatarFallback>
                              </Avatar>
                            </a>
                          ) : i === 1 ? (
                            <a 
                              key={i} 
                              href="https://www.linkedin.com/in/ruth-nacey-2130749/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:z-10 transition-transform hover:scale-110"
                            >
                              <Avatar className="w-12 h-12 border-2 border-background">
                                <AvatarImage src={ruthHeadshot} alt="Ruth Nacey" />
                                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                  RN
                                </AvatarFallback>
                              </Avatar>
                            </a>
                          ) : i === 2 ? (
                            <a 
                              key={i} 
                              href="https://www.linkedin.com/in/thescottfleming/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:z-10 transition-transform hover:scale-110"
                            >
                              <Avatar className="w-12 h-12 border-2 border-background">
                                <AvatarImage src={scottHeadshot} alt="Scott Fleming" />
                                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                  SF
                                </AvatarFallback>
                              </Avatar>
                            </a>
                          ) : (
                            <Avatar key={i} className="w-12 h-12 border-2 border-background">
                              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {item.split(' ').slice(-1)[0].substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )
                        ))}
                      </div>
                    ) : (
                      <Avatar className="w-12 h-12 mb-4">
                        {member.title === "My Role" && (
                          <AvatarImage src={jordanHeadshot} alt={member.title} />
                        )}
                        <AvatarFallback className="bg-primary/10">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
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