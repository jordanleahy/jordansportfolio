import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Challenge } from "@/types/caseStudy";

interface ProblemSectionProps {
  title: string;
  description: string;
  challenges: Challenge[];
  iframeUrl?: string;
  iframeTitle?: string;
}

export const ProblemSection = ({ title, description, challenges, iframeUrl, iframeTitle }: ProblemSectionProps) => {
  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6">{title}</h2>
          <p className="text-[18px] font-normal leading-[27px] tracking-[-0.18px] mb-6" style={{ color: '#000' }}>{description}</p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
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
              </div>
            ))}
          </div>
          
          {iframeUrl && (
            <div className="w-full">
              <iframe
                src={iframeUrl}
                title={iframeTitle || "Embedded content"}
                className="w-full h-[600px] border border-border rounded-lg shadow-sm"
                loading="lazy"
                allowFullScreen
              />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};