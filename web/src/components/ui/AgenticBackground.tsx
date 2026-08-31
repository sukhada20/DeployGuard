"use client";

import React, { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  pulse: number;
  label?: string;
}

interface StreamPacket {
  sourceIndex: number;
  targetIndex: number;
  progress: number;
  speed: number;
}

export function AgenticBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.active = true;
      if (mouseRef.current.x < 0) {
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
      }
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const LABELS = [
      "agent:deploy_monitor",
      "gemini:reasoning_core",
      "cloud_deploy:rollback_armed",
      "otel:span_0x7f2a",
      "mttr:38.4s",
      "model_armor:enforced",
      "firestore:vector_004",
      "policy:5_of_5_pass",
      "gke:gateway_active",
      "telemetry:sampling_1000ms",
      "cloud_monitoring:nominal",
      "postmortem:generator_ready",
    ];

    // Initialize Particles (30 to 45 nodes)
    const count = Math.max(28, Math.min(48, Math.floor((width * height) / 22000)));
    const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() > 0.6 ? 5 : 3.5,
      pulse: Math.random() * Math.PI * 2,
      label: i < LABELS.length ? LABELS[i] : undefined,
    }));

    const packets: StreamPacket[] = [];
    const maxPackets = 16;
    let time = 0;
    let scanlineY = 0;

    const draw = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");

      // Smooth mouse lerp
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;
      }

      // 1. Moving Telemetry Scanline
      scanlineY = (scanlineY + 0.75) % height;
      const scanGrad = ctx.createLinearGradient(0, scanlineY - 20, 0, scanlineY + 20);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)");
      scanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanlineY - 20, width, 40);

      // 2. Smooth Cursor Ambient Spotlight
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        const spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 300);
        spotGrad.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)");
        spotGrad.addColorStop(1, "transparent");
        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 300, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Update & Draw Particles and Inter-Node Connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulse += 0.03;

        // Smooth sinusoidal drift
        p.x += p.vx + Math.sin(time + p.pulse) * 0.25;
        p.y += p.vy + Math.cos(time + p.pulse) * 0.25;

        // Wrap around bounds
        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;

        // Check proximity to smooth cursor
        let mouseDist = 999;
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          mouseDist = Math.sqrt(dx * dx + dy * dy);
        }
        const isNearCursor = mouseDist < 200;
        const prox = isNearCursor ? 1 - mouseDist / 200 : 0;

        // Draw Inter-node Links
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            const alpha = (1 - dist / 180) * (isDark ? 0.22 : 0.16) + (prox * 0.15);
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${alpha})`
              : `rgba(0, 0, 0, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Spawn data packet
            if (packets.length < maxPackets && Math.random() < 0.005) {
              packets.push({
                sourceIndex: i,
                targetIndex: j,
                progress: 0,
                speed: 0.006 + Math.random() * 0.01,
              });
            }
          }
        }

        // Draw Particle Node (crisp diamond / square)
        const nodeSize = p.size + prox * 2;
        const nodeAlpha = isDark ? 0.65 + prox * 0.35 : 0.55 + prox * 0.4;
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${nodeAlpha})`
          : `rgba(0, 0, 0, ${nodeAlpha})`;

        ctx.fillRect(p.x - nodeSize / 2, p.y - nodeSize / 2, nodeSize, nodeSize);

        // Glowing outer pulse ring
        const ringRadius = nodeSize * 2.2 + Math.sin(p.pulse) * 3;
        ctx.strokeStyle = isDark
          ? `rgba(255, 255, 255, ${0.18 + prox * 0.3})`
          : `rgba(0, 0, 0, ${0.14 + prox * 0.25})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Monospace Telemetry Label
        if (p.label) {
          ctx.font = "bold 9px ui-monospace, SFMono-Regular, Menlo, monospace";
          const labelAlpha = isDark ? 0.45 + prox * 0.45 : 0.45 + prox * 0.45;
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${labelAlpha})`
            : `rgba(0, 0, 0, ${labelAlpha})`;
          ctx.fillText(`[${p.label}]`, p.x + 10, p.y + 3);
        }
      }

      // 4. Draw Traveling Data Packets
      for (let k = packets.length - 1; k >= 0; k--) {
        const pkt = packets[k];
        pkt.progress += pkt.speed;

        const src = particles[pkt.sourceIndex];
        const tgt = particles[pkt.targetIndex];

        if (!src || !tgt || pkt.progress >= 1) {
          packets.splice(k, 1);
          continue;
        }

        const currX = src.x + (tgt.x - src.x) * pkt.progress;
        const currY = src.y + (tgt.y - src.y) * pkt.progress;

        // Bright Glowing Data Packet Head
        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(currX - 2.5, currY - 2.5, 5, 5);

        // Glowing Trail
        const trailProg = Math.max(0, pkt.progress - 0.08);
        const trailX = src.x + (tgt.x - src.x) * trailProg;
        const trailY = src.y + (tgt.y - src.y) * trailProg;

        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(currX, currY);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isClient]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Engineering Coordinate Grid with High Contrast */}
      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* 2. Micro Coordinate Dots */}
      <div
        className="absolute inset-0 opacity-[0.16] dark:opacity-[0.22]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1.5px, transparent 1.5px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* 3. Ambient Lighting Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-foreground/[0.035] rounded-full blur-[120px] pointer-events-none" />

      {/* 4. Canvas Node Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* 5. Peripheral HUD Coordinates */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-muted-foreground/60 tracking-wider hidden md:block">
        + 0x00_ROOT · AUTONOMOUS_GOVERNANCE_ACTIVE
      </div>
      <div className="absolute top-3 right-4 font-mono text-[9px] text-muted-foreground/60 tracking-wider hidden md:block">
        OTEL_SPAN_STREAM · 1000MS_SAMPLING +
      </div>
      <div className="absolute bottom-3 left-4 font-mono text-[9px] text-muted-foreground/60 tracking-wider hidden md:block">
        + GKE_CLOUD_DEPLOY · TWO_TIER_GATEWAY
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-muted-foreground/60 tracking-wider hidden md:block">
        VERTEX_EMBED_004 · 5_OF_5_SAFE_VERIFIED +
      </div>
    </div>
  );
}
