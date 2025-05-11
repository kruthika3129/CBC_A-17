"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BackgroundBeamsProps {
  className?: string;
}

export const BackgroundBeams: React.FC<BackgroundBeamsProps> = ({
  className,
}) => {
  const beamContainerRef = useRef<HTMLDivElement>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const beamContainer = beamContainerRef.current;
    if (!beamContainer) return;

    // Performance optimization - only animate when visible
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInViewport(entries[0].isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(beamContainer);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isInViewport) return;

      const { clientX, clientY } = e;
      const { left, top, width, height } = beamContainer.getBoundingClientRect();

      const x = (clientX - left) / width;
      const y = (clientY - top) / height;

      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      observer.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isInViewport]);

  return (
    <div
      ref={beamContainerRef}
      className={cn(
        "h-full w-full absolute inset-0 overflow-hidden -z-10",
        className
      )}
    >
      {/* Beams */}
      <div
        className="absolute inset-0 z-[-1]"
        style={{
          background:
            "radial-gradient(circle at calc(var(--x, 0) * 100%) calc(var(--y, 0) * 100%), rgba(120, 120, 255, 0.15), transparent 40%)",
          "--x": mousePosition.x,
          "--y": mousePosition.y,
        } as React.CSSProperties}
      />

      {/* Primary beam */}
      <div
        className="absolute inset-0 z-[-1] opacity-70"
        style={{
          background:
            "radial-gradient(circle at calc(var(--x, 0) * 100%) calc(var(--y, 0) * 100%), rgba(120, 120, 255, 0.25), transparent 25%)",
          "--x": mousePosition.x,
          "--y": mousePosition.y,
        } as React.CSSProperties}
      />

      {/* Secondary beams */}
      <div
        className="absolute inset-0 z-[-1] opacity-50"
        style={{
          background:
            "radial-gradient(circle at calc(var(--x, 0) * 100%) calc(var(--y, 0) * 100%), rgba(255, 120, 120, 0.15), transparent 30%)",
          "--x": mousePosition.x > 0.5 ? mousePosition.x - 0.3 : mousePosition.x + 0.3,
          "--y": mousePosition.y > 0.5 ? mousePosition.y - 0.3 : mousePosition.y + 0.3,
        } as React.CSSProperties}
      />

      {/* Tertiary beams */}
      <div
        className="absolute inset-0 z-[-1] opacity-30"
        style={{
          background:
            "radial-gradient(circle at calc(var(--x, 0) * 100%) calc(var(--y, 0) * 100%), rgba(120, 255, 180, 0.15), transparent 35%)",
          "--x": mousePosition.x > 0.5 ? mousePosition.x - 0.2 : mousePosition.x + 0.2,
          "--y": mousePosition.y > 0.5 ? mousePosition.y - 0.2 : mousePosition.y + 0.2,
        } as React.CSSProperties}
      />

      {/* Noise overlay - using CSS pattern instead of image */}
      <div
        className="absolute inset-0 z-[-1] opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
};
