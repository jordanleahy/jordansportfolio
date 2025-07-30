import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Eye, EyeOff } from "lucide-react";
import { FigmaPresentationViewer } from "./FigmaPresentationViewer";

interface FigmaPasswordSectionProps {
  title: string;
  description?: string;
  password: string;
  presentationUrl: string;
}

export const FigmaPasswordSection = ({ 
  title, 
  description, 
  password, 
  presentationUrl 
}: FigmaPasswordSectionProps) => {
  const [enteredPassword, setEnteredPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword === password) {
      setIsUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!isUnlocked ? (
            <motion.div
              key="password-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-8">
                <motion.div 
                  className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Lock className="w-8 h-8 text-primary" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">{title}</h2>
                {description && (
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {description}
                  </p>
                )}
              </div>

              <Card className="max-w-md mx-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password to view presentation"
                      value={enteredPassword}
                      onChange={(e) => setEnteredPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button type="submit" className="w-full">
                    View Figma Presentation
                  </Button>
                </form>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="presentation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FigmaPresentationViewer 
                title={title}
                presentationUrl={presentationUrl}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};