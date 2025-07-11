import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AlertCircle, Target } from "lucide-react";

interface Challenge {
  type: 'problem' | 'need';
  title: string;
  items: string[];
}

interface ChallengesListProps {
  challenges: Challenge[];
}

export const ChallengesList = ({ challenges }: ChallengesListProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {challenges.map((challenge, index) => (
        <motion.div
          key={challenge.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`p-6 border-l-4 ${
            challenge.type === 'problem' 
              ? 'border-l-destructive' 
              : 'border-l-primary'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {challenge.type === 'problem' ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Target className="h-5 w-5 text-primary" />
              )}
              <h4 className={`font-semibold ${
                challenge.type === 'problem' 
                  ? 'text-destructive' 
                  : 'text-primary'
              }`}>
                {challenge.title}
              </h4>
            </div>
            <ul className="text-muted-foreground text-sm space-y-1">
              {challenge.items.map((item, itemIndex) => (
                <li key={itemIndex}>• {item}</li>
              ))}
            </ul>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};