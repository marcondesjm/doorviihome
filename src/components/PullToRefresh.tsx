import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const y = useMotionValue(0);
  
  const THRESHOLD = 80;
  
  const opacity = useTransform(y, [0, THRESHOLD], [0, 1]);
  const scale = useTransform(y, [0, THRESHOLD], [0.5, 1]);
  const rotate = useTransform(y, [0, THRESHOLD * 2], [0, 360]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, (currentY - startY.current) * 0.5);
    
    if (diff > 0) {
      y.set(Math.min(diff, THRESHOLD * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing) return;
    
    if (y.get() >= THRESHOLD) {
      setIsRefreshing(true);
      animate(y, THRESHOLD, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(y, 0, { duration: 0.3 });
      }
    } else {
      animate(y, 0, { duration: 0.3 });
    }
    
    startY.current = 0;
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{ y: useTransform(y, (v) => v * 0.5), opacity, scale }}
        className="absolute top-0 left-0 right-0 flex justify-center py-2 z-10"
      >
        <motion.div
          style={{ rotate: isRefreshing ? undefined : rotate }}
          animate={isRefreshing ? { rotate: 360 } : undefined}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : undefined}
          className="p-2 rounded-full bg-primary/10"
        >
          <RefreshCw className="w-5 h-5 text-primary" />
        </motion.div>
      </motion.div>
      
      <motion.div
        ref={containerRef}
        style={{ y }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
