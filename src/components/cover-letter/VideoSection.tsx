
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { TimeOnTaskTimer } from "@/components/TimeOnTaskTimer";

interface VideoSectionProps {
  videoSrc: string;
  posterSrc: string;
  showTimer?: boolean;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ 
  videoSrc, 
  posterSrc, 
  showTimer = true 
}) => {
  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardContent className="p-0 space-y-4">
        <AspectRatio ratio={9/16}>
          <video 
            className="w-full h-full object-cover rounded-lg"
            controls
            preload="metadata"
            muted
            autoPlay={false}
            poster={posterSrc}
          >
            <source src={videoSrc} type="video/mp4" />
            <source src={videoSrc} type="video/quicktime" />
            Your browser does not support the video tag.
          </video>
        </AspectRatio>
        {showTimer && <TimeOnTaskTimer />}
      </CardContent>
    </Card>
  );
};
