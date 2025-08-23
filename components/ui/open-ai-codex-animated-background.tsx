import { cn } from "@/lib/utils";
import { useState, useEffect, memo } from "react";
import dynamic from "next/dynamic";

// Client-only import to avoid SSR issues
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
      // Round to nearest 128px to further reduce update churn
      const w = Math.round(window.innerWidth / 128) * 128;
      const h = Math.round(window.innerHeight / 128) * 128;
      setWindowSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    }, 300);

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Detect reduced motion preference
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
};

// Page visibility hook to pause/unmount when background tab
const usePageVisible = () => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    onVis();
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  return visible;
};

const BackgroundInner = () => {
  const { width, height } = useWindowSize();
  const reducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisible();
  const [shouldRender, setShouldRender] = useState(false);

  // Lazy mount heavy scene after main thread is idle or on first interaction
  useEffect(() => {
    let done = false;
    const mount = () => {
      if (!done) {
        done = true;
        setShouldRender(true);
        window.removeEventListener('pointerdown', mount);
        window.removeEventListener('mousemove', mount);
        window.removeEventListener('keydown', mount);
        window.removeEventListener('touchstart', mount);
      }
    };

    // Prefer idle time
    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout?: number }) => number)
      | undefined;
    const idleId = idle ? idle(mount, { timeout: 800 }) : window.setTimeout(mount, 500);

    // But render immediately on interaction
    window.addEventListener('pointerdown', mount, { once: true });
    window.addEventListener('mousemove', mount, { once: true });
    window.addEventListener('keydown', mount, { once: true });
    window.addEventListener('touchstart', mount, { once: true });

    return () => {
      if (!done) {
        idle ? (window as any).cancelIdleCallback?.(idleId) : clearTimeout(idleId);
        window.removeEventListener('pointerdown', mount);
        window.removeEventListener('mousemove', mount);
        window.removeEventListener('keydown', mount);
        window.removeEventListener('touchstart', mount);
      }
    };
  }, []);

  // If user prefers reduced motion or the page is hidden, render a lightweight static layer
  if (reducedMotion || !isVisible || !shouldRender) {
    return (
      <div
        className={cn("w-full h-full")}
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(1200px 600px at 50% 20%, rgba(255,255,255,0.25), rgba(255,255,255,0) 60%)',
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center w-full h-full")}
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <UnicornScene
        production={true}
        projectId="1grEuiVDSVmyvEMAYhA6"
        width={width}
        height={height}
      />
    </div>
  );
};

// Memoized to avoid re-renders during unrelated state updates (e.g., search results)
export const Component = memo(BackgroundInner);
