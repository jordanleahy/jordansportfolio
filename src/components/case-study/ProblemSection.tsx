import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Challenge } from "@/types/caseStudy";

interface ProblemSectionProps {
  title: string;
  description: string;
  challenges: Challenge[];
}

export const ProblemSection = ({ title, description, challenges }: ProblemSectionProps) => {
  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6">{title}</h2>
          <p className="text-lg leading-relaxed text-muted-foreground mb-6">{description}</p>
          <div className="grid md:grid-cols-2 gap-6">
            {challenges.map((challenge, index) => (
              <div key={index} className="space-y-6">
                <Card className="p-6">
                  <h4 className="font-semibold mb-2">{challenge.title}</h4>
                  <ul className="space-y-2">
                    {challenge.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-muted-foreground text-sm flex items-start gap-2">
                        <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
                {challenge.title === "Clinical Impact" && (
                  <div className="md:-mx-8 lg:-mx-16 xl:-mx-32">
                    <img 
                      src="/lovable-uploads/cd122851-7533-4359-91a4-37ade8b9c3b8.png" 
                      alt="Sepsis diagnosis review system showing denial risk and clinical criteria"
                      className="w-full rounded-lg shadow-lg"
                    />
                  </div>
                )}
                {challenge.title === "Design Challenges" && (
                  <div className="md:-mx-8 lg:-mx-16 xl:-mx-32">
                    <img 
                      src="/lovable-uploads/33fa38f7-39a9-445e-aa58-4031125e0692.png" 
                      alt="CDI specialist reviewing sepsis validation criteria on dashboard interface"
                      className="w-full rounded-lg shadow-lg mx-auto"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};