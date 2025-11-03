import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, TrendingUp, Activity, CheckCircle } from "lucide-react";
import { personalIntroData } from "@/data/personalIntro";

const iconMap = {
  Clock,
  Users,
  TrendingUp,
  Activity
};

const PersonalIntroSection = () => {
  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="personal-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" className="text-primary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#personal-grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-2xl" />
              <img
                src={personalIntroData.imageUrl}
                alt="Jordan Leahy - Healthcare Product Designer"
                className="relative w-full h-auto rounded-2xl shadow-2xl border-2 border-primary/10"
              />
            </div>
          </motion.div>

          {/* Right: Headline & Story */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 space-y-6"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="inline-block mb-4"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-body-sm font-medium text-primary">About Jordan</span>
                </div>
              </motion.div>
              
              <h1 className="text-[42px] lg:text-[56px] font-medium leading-tight tracking-tight text-foreground mb-4">
                {personalIntroData.headline}
              </h1>
              <p className="text-[18px] text-primary font-medium mb-6">
                {personalIntroData.subheadline}
              </p>
            </div>

            <div className="space-y-4">
              {personalIntroData.story.map((paragraph, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-[16px] leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {personalIntroData.stats.map((stat, index) => {
            const Icon = iconMap[stat.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                    <p className="text-sm text-muted-foreground leading-snug">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Philosophy Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                {personalIntroData.philosophy.title}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {personalIntroData.philosophy.points.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{point}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default PersonalIntroSection;
