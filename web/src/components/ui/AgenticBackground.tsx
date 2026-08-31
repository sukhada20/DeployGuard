"use client";

import React, { useEffect, useRef, useState } from "react";

export function AgenticBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Agentic Network Nodes (15-20 subtle drifting nodes)
    const nodeCount = Math.min(22, Math.floor(width / 70));
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 1.5 + 1,
    }));

    let scanY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");
      const dotColor = isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)";
      const lineColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)";
      const activeLineColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)";
      const scanColor = isDark ? "rgba(255, 255, 255, 0.025)" : "rgba(0, 0, 0, 0.02)";

      // 1. Subtle horizontal telemetry scan beam
      scanY = (scanY + 0.4) % height;
      ctx.fillStyle = scanColor;
      ctx.fillRect(0, scanY, width, 1.5);

      // 2. Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        // Draw node dot
        ctx.fillStyle = dotColor;
        ctx.fillRect(node.x - 1, node.y - 1, 2, 2);

        // Connect adjacent nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Mouse interaction: connect near mouse
        const mdx = node.x - mousePos.x;
        const mdy = node.y - mousePos.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 120) {
          ctx.strokeStyle = activeLineColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* 1. Monochromatic CSS Engineering Grid */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.045]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* 2. Micro Dot Matrix */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* 3. Live Canvas Node Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 4. Peripheral Corner Technical Coordinates */}
      <div className="absolute top-2 left-3 font-mono text-[9px] text-muted-foreground/30 hidden md:block">
        + 0x00_ADDR · FLEET_TOPOLOGY
      </div>
      <div className="absolute top-2 right-3 font-mono text-[9px] text-muted-foreground/30 hidden md:block">
        OTEL_SPAN_TRACE · 1000MS +
      </div>
      <div className="absolute bottom-2 left-3 font-mono text-[9px] text-muted-foreground/30 hidden md:block">
        + GKE_RUN_GATEWAY · ACTIVE
      </div>
      <div className="absolute bottom-2 right-3 font-mono text-[9px] text-muted-foreground/30 hidden md:block">
        VERTEX_EMBED_004 · SECURED +
      </div>
    </div>
  );
}
