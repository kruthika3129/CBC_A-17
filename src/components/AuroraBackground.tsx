
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface AuroraBackgroundProps {
  className?: string;
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const pointsRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    contextRef.current = context;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPoints();
    };

    const initPoints = () => {
      const width = canvas.width;
      const height = canvas.height;
      const numberOfPoints = 15;
      
      pointsRef.current = [];
      
      // The Mono theme colors
      const colors = ['#403E43', '#8E9196', '#8A898C', '#9F9EA1'];
      
      for (let i = 0; i < numberOfPoints; i++) {
        pointsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 100 + 50,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };
    
    const drawPoints = () => {
      if (!contextRef.current || !canvas) return;
      
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
      
      pointsRef.current.forEach(point => {
        contextRef.current!.beginPath();
        const gradient = contextRef.current!.createRadialGradient(
          point.x, point.y, 0, 
          point.x, point.y, point.radius
        );
        gradient.addColorStop(0, `${point.color}30`);
        gradient.addColorStop(1, `${point.color}00`);
        contextRef.current!.fillStyle = gradient;
        contextRef.current!.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        contextRef.current!.fill();
      });
    };
    
    const updatePoints = () => {
      if (!canvas) return;
      
      pointsRef.current.forEach(point => {
        point.x += point.vx;
        point.y += point.vy;
        
        if (point.x < 0) point.x = canvas.width;
        if (point.x > canvas.width) point.x = 0;
        if (point.y < 0) point.y = canvas.height;
        if (point.y > canvas.height) point.y = 0;
      });
    };
    
    const animate = () => {
      updatePoints();
      drawPoints();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    let animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute top-0 left-0 w-full h-full -z-10 opacity-60 ${className || ''}`}
    />
  );
};

export default AuroraBackground;
