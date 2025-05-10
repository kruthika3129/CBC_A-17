
import { useEffect, useRef } from 'react';

interface PulseOrbProps {
  className?: string;
}

const PulseOrb: React.FC<PulseOrbProps> = ({ className }) => {
  const orbRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = orb.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from cursor to orb center
      const distX = clientX - centerX;
      const distY = clientY - centerY;
      
      // Move the orb slightly toward the cursor
      orb.style.transform = `translate(${distX * 0.02}px, ${distY * 0.02}px)`;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <div 
      ref={orbRef}
      className={`orb transition-transform duration-500 ${className || ''}`}
    />
  );
};

export default PulseOrb;
