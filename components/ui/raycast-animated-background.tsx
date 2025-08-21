import { cn } from "@/lib/utils";
import { useState, useEffect, memo } from "react";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues if the library touches window/document at import time
const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export const Component = memo(() => {
  const { width, height } = useWindowSize();

  return (
    <div className={cn("w-full h-full")}
         style={{ pointerEvents: "none" }}>
      <UnicornScene
        production={true}
        projectId="cbmTT38A0CcuYxeiyj5H"
        width={width}
        height={height}
      />
    </div>
  );
});

