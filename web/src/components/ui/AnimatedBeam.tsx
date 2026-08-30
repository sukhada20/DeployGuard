"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedBeamProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color?: string;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({ fromX, fromY, toX, toY, color = "#06b6d4" }) => {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      gsap.fromTo(
        pathRef.current,
        { strokeDashoffset: length, strokeDasharray: length },
        { strokeDashoffset: 0, duration: 1.5, repeat: -1, ease: "power1.inOut" }
      );
    }
  }, [fromX, fromY, toX, toY]);

  const midX = (fromX + toX) / 2;
  const pathD = `M ${fromX} ${fromY} Q ${midX} ${fromY - 40} ${toX} ${toY}`;

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full">
      <path d={pathD} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <path ref={pathRef} d={pathD} fill="none" stroke={color} strokeWidth="2.5" />
    </svg>
  );
};
