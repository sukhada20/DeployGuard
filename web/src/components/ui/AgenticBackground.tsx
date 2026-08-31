"use client";

import React, { useEffect, useRef, useState } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label?: string;
  pulsePhase: number;
}

interface Packet {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
}

export function AgenticBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY, active: true });
    };
    const handleMouseLeave = () => {
      setMousePos({ x: -1000, y: -1000, active: false });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Labels resembling agent telemetry & SRE signals
    const LABELS = [
      "agent:deploy_monitor",
      "gemini:reasoning",
      "clouddeploy:rollout",
      "otel:span_482",
      "mttr:38.4s",
      "model_armor:pass",
      "firestore:vector",
      "policy:5_of_5",
      "gke:ingress_ok",
      "run:telemetry",
    ];

    // Create Agentic Network Nodes
    const nodeCount = Math.max(24, Math.min(42, Math.floor((window.innerWidth * window.innerHeight) / 28000)));
    const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() > 0.7 ? 2.5 : 1.5,
      label: i < LABELS.length ? LABELS[i] : undefined,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // Data packets travelling between nodes
    const packets: Packet[] = [];
    const maxPackets = 12;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");

      // Contrast calibrated colors
      const gridColor = isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.045)";
      const dotColor = isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";
      const lineColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)";
      const labelColor = isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.45)";
      const packetColor = isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)";
      const mouseLineColor = isDark ? "rgba(255, 255, 255, 0.28)" : "rgba(0, 0, 0, 0.25)";

      // 1. Draw Architectural Grid Lines
      const gridSize = 64;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 2. Draw Subtle Crosshairs at Grid Intersections
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
      for (let x = 0; x < width; x += gridSize * 2) {
        for (let y = 0; y < height; y += gridSize * 2) {
          ctx.fillRect(x - 2, y, 5, 1);
          ctx.fillRect(x, y - 2, 1, 5);
        }
      }

      // 3. Update & Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        node.pulsePhase += 0.03;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        // Draw node square / diamond
        ctx.fillStyle = dotColor;
        ctx.fillRect(node.x - node.radius, node.y - node.radius, node.radius * 2, node.radius * 2);

        // Draw subtle label on select nodes
        if (node.label) {
          ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.fillStyle = labelColor;
          ctx.fillText(`[${node.label}]`, node.x + 6, node.y + 3);
        }

        // Connect adjacent nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alphaRatio = 1 - dist / 150;
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${0.04 + alphaRatio * 0.12})`
              : `rgba(0, 0, 0, ${0.03 + alphaRatio * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();

            // Occasionally spawn packet between connected nodes
            if (packets.length < maxPackets && Math.random() < 0.003) {
              packets.push({
                fromIndex: i,
                toIndex: j,
                progress: 0,
                speed: 0.008 + Math.random() * 0.012,
              });
            }
          }
        }

        // Interactive mouse proximity line
        if (mousePos.active) {
          const mdx = node.x - mousePos.x;
          const mdy = node.y - mousePos.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < 140) {
            const mAlpha = 1 - mdist / 140;
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${mAlpha * 0.35})`
              : `rgba(0, 0, 0, ${mAlpha * 0.3})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mousePos.x, mousePos.y);
            ctx.stroke();

            // Highlight proximate node
            ctx.fillStyle = packetColor;
            ctx.fillRect(node.x - 3, node.y - 3, 6, 6);
          }
        }
      }

      // 4. Animate Data Packets travelling between nodes
      for (let p = packets.length - 1; p >= 0; p--) {
        const pkt = packets[p];
        pkt.progress += pkt.speed;

        const from = nodes[pkt.fromIndex];
        const to = nodes[pkt.toIndex];

        if (!from || !to || pkt.progress >= 1) {
          packets.splice(p, 1);
          continue;
        }

        const px = from.x + (to.x - from.x) * pkt.progress;
        const py = from.y + (to.y - from.y) * pkt.progress;

        ctx.fillStyle = packetColor;
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      }

      // 5. Mouse Crosshair & Coordinate HUD
      if (mousePos.active) {
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 1;

        // Subtle crosshair
        ctx.beginPath();
        ctx.moveTo(mousePos.x - 12, mousePos.y);
        ctx.lineTo(mousePos.x + 12, mousePos.y);
        ctx.moveTo(mousePos.x, mousePos.y - 12);
        ctx.lineTo(mousePos.x, mousePos.y + 12);
        ctx.stroke();

        // Coordinate tag
        ctx.font = "8px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.4)";
        ctx.fillText(`LOC: [${Math.round(mousePos.x)}, ${Math.round(mousePos.y)}]`, mousePos.x + 8, mousePos.y - 8);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
