import { cn } from "@/lib/utils";
import { useState, useEffect, memo } from "react";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues if the library touches window/document at import time
const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

// Optimized resize hook (debounced & rounded) to limit re-renders
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const debounce = (fn: () => void, ms = 200) => {
      let t: any;
      return () => {
        clearTimeout(t);
        t = setTimeout(fn, ms);
      };
    };

    const handleResize = debounce(() => {
      const w = Math.round(window.innerWidth / 64) * 64;
      const h = Math.round(window.innerHeight /64) * 64;
      setWindowSize((prev)=> (prev.width===w && prev.height===h? prev : {width:w,height:h}));
    },250);

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const Scene = memo(()=>{
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

export const Component = Scene;
