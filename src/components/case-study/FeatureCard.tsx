import { LucideIcon } from "lucide-react";
import { AnimatedCard } from "./AnimatedCard";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  iconColor?: string;
}

export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0,
  iconColor = "text-primary"
}: FeatureCardProps) => {
  return (
    <AnimatedCard delay={delay} className="p-6 h-full">
      <Icon className={`h-8 w-8 ${iconColor} mb-4`} />
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </AnimatedCard>
  );
};