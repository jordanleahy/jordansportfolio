import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share2, Copy, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogCTAShareProps {
  ctaText: string;
  ctaUrl?: string;
  shareEnabled?: boolean;
  title?: string;
  url?: string;
  className?: string;
}

export const BlogCTAShare = ({ 
  ctaText, 
  ctaUrl, 
  shareEnabled = true, 
  title = "Blog Post",
  url = window.location.href,
  className = "" 
}: BlogCTAShareProps) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = (platform: 'linkedin' | 'twitter' | 'whatsapp') => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    const shareUrls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={`py-16 px-4 ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-12 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold mb-6 flex items-center justify-center gap-3"
            >
              🚀 Take Action
            </motion.h2>

            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8"
            >
              <Button 
                size="lg"
                className="text-lg px-8 py-4"
                onClick={() => ctaUrl && window.open(ctaUrl, '_blank')}
              >
                {ctaText}
              </Button>
            </motion.div>

            {shareEnabled && (
              <>
                {/* Share Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-wrap justify-center gap-3 mb-6"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy This
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('linkedin')}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    X
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </motion.div>

                {/* Engagement Options */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-sm text-muted-foreground border-t border-muted pt-6"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>💬 Leave a comment or reply via DM</span>
                  </div>
                  <p>🔗 Share: LinkedIn | X | WhatsApp</p>
                </motion.div>
              </>
            )}
          </div>
        </Card>
      </div>
    </motion.section>
  );
};