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
    <section className="py-12 px-4 bg-[#084542] relative overflow-hidden">
      {/* Line Pattern Overlay */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="line-pattern" x="0" y="0" width="100" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="0" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#line-pattern)" />
        </svg>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-medium text-[24px] leading-[31.2px] mb-6 text-white">{title}</h2>
          <p className="text-[18px] font-normal leading-[27px] tracking-[-0.18px] mb-6 text-white">{description}</p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {challenges.map((challenge, index) => (
              <div key={index} className="space-y-6">
                <Card className="p-6">
                  <h4 className="font-semibold mb-2">{challenge.title}</h4>
                  <ul className="space-y-2">
                    {challenge.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm flex items-start gap-2" style={{ color: '#000' }}>
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