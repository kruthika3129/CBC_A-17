
import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PulseOrbProps {
  className?: string;
}

const PulseOrb: React.FC<PulseOrbProps> = ({ className }) => {
  const orbRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isInViewport, setIsInViewport] = useState(false);
  
  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;
    
    // Performance optimization - only animate when visible
    const observer = new IntersectionObserver((entries) => {
      setIsInViewport(entries[0].isIntersecting);
    }, { threshold: 0.1 });
    
    observer.observe(orb);
    
    // Skip mouse tracking on mobile devices for better performance
    if (isMobile || !isInViewport) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = orb.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from cursor to orb center
      const distX = clientX - centerX;
      const distY = clientY - centerY;
      
      // Throttled and optimized movement
      requestAnimationFrame(() => {
        // Move the orb slightly toward the cursor (reduced effect for better performance)
        orb.style.transform = `translate(${distX * 0.01}px, ${distY * 0.01}px)`;
      });
    };
    
    const throttledMouseMove = throttle(handleMouseMove, 16); // ~60fps
    
    document.addEventListener('mousemove', throttledMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', throttledMouseMove);
      observer.disconnect();
    };
  }, [isMobile, isInViewport]);
  
  return (
    <div 
      ref={orbRef}
      className={`transition-transform duration-500 ease-out ${className || ''}`}
    />
  );
};

// Utility function for throttling events
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export default PulseOrb;
