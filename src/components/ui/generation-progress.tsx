import { Clock, Sparkles, Upload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  active: boolean;
}

interface GenerationProgressProps {
  className?: string;
  currentStep?: 'prompt' | 'image' | 'upload' | 'complete';
  variant?: 'default' | 'compact' | 'minimal';
  timeRemaining?: number;
}

export const GenerationProgress = ({
  className = "",
  currentStep = 'prompt',
  variant = 'default',
  timeRemaining
}: GenerationProgressProps) => {
  const steps: GenerationStep[] = [
    {
      key: 'prompt',
      label: 'Creating prompt',
      icon: <Sparkles className="h-3 w-3" />,
      completed: ['image', 'upload', 'complete'].includes(currentStep),
      active: currentStep === 'prompt'
    },
    {
      key: 'image',
      label: 'Generating image',
      icon: <Clock className="h-3 w-3" />,
      completed: ['upload', 'complete'].includes(currentStep),
      active: currentStep === 'image'
    },
    {
      key: 'upload',
      label: 'Uploading',
      icon: <Upload className="h-3 w-3" />,
      completed: currentStep === 'complete',
      active: currentStep === 'upload'
    }
  ];

  const formatTime = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (variant === 'minimal') {
    const activeStep = steps.find(step => step.active);
    return (
      <div className={cn(
        "flex items-center gap-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md border text-xs",
        className
      )}>
        {activeStep?.icon}
        <span>{activeStep?.label}...</span>
        {timeRemaining && (
          <span className="text-muted-foreground">{formatTime(timeRemaining)}</span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md border",
        className
      )}>
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={cn(
              "flex items-center gap-1 text-xs",
              step.completed && "text-green-600",
              step.active && "text-primary",
              !step.active && !step.completed && "text-muted-foreground"
            )}
          >
            {step.completed ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <div className={cn(
                "transition-colors",
                step.active && "animate-pulse"
              )}>
                {step.icon}
              </div>
            )}
            {index < steps.length - 1 && (
              <div className={cn(
                "w-2 h-px bg-border mx-1",
                step.completed && "bg-success/20"
              )} />
            )}
          </div>
        ))}
        {timeRemaining && (
          <div className="text-xs text-muted-foreground ml-2">
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col gap-2 bg-background/90 backdrop-blur-sm p-3 rounded-md border",
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Generating Image</span>
        {timeRemaining && (
          <span className="text-xs text-muted-foreground">
            {formatTime(timeRemaining)}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 text-xs",
              step.completed && "text-green-600",
              step.active && "text-primary",
              !step.active && !step.completed && "text-muted-foreground"
            )}>
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <div className={cn(
                  "transition-colors",
                  step.active && "animate-pulse"
                )}>
                  {step.icon}
                </div>
              )}
              <span>{step.label}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "w-4 h-px bg-border",
                step.completed && "bg-success/20"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};