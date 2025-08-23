import { useState, useEffect } from "react";
import { Component as RaycastAnimatedBackground } from "./raycast-animated-background";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
  children?: React.ReactNode;
  className?: string;
}

export const LoadingScreen = ({ 
  onComplete, 
  duration = 5000, 
  children, 
  className 
}: LoadingScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (duration / 100));
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            onComplete?.();
          }, 100);
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center bg-transparent",
      className
    )}>
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <RaycastAnimatedBackground />
      </div>
      {/* Soft overlay for readability */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/20 to-background/60" />
      
      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Next Search
          </h1>
          <p className="text-lg text-muted-foreground">
            Initializing your search experience...
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-80 bg-secondary rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-100 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Progress Percentage */}
        <div className="text-sm text-muted-foreground font-mono">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};
