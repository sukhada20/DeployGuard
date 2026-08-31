"use client";

import React, { useEffect, useRef, useState } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  pulse: number;
  label?: string;
}

interface Packet {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
}

export function AgenticBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

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
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let isRunning = true;
    let animId: number;

    let width = (canvas.width = window.innerWidth || 1200);
    let height = (canvas.height = window.innerHeight || 800);

    const handleResize = () => {
      if (!canvas || !isRunning) return;
      width = canvas.width = window.innerWidth || 1200;
      height = canvas.height = window.innerHeight || 800;
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

    // Initialize 32 to 48 Agent Nodes
    const nodeCount = Math.max(30, Math.min(50, Math.floor((width * height) / 22000)));
    const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      size: Math.random() > 0.55 ? 5 : 3.5,
      pulse: Math.random() * Math.PI * 2,
      label: i < LABELS.length ? LABELS[i] : undefined,
    }));

    const packets: Packet[] = [];
    const maxPackets = 16;
    let time = 0;
    let scanY = 0;

    const loop = () => {
      if (!isRunning) return;

      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");

      // Smooth cursor interpolation
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      }

      // 1. Moving Telemetry Scanline
      scanY = (scanY + 0.8) % height;
      const scanGrad = ctx.createLinearGradient(0, scanY - 24, 0, scanY + 24);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, isDark ? "rgba(255, 255, 255, 0.065)" : "rgba(0, 0, 0, 0.045)");
      scanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 24, width, 48);

      // 2. Cursor Ambient Spotlight
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        const spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 280);
        spotGrad.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.06)");
        spotGrad.addColorStop(1, "transparent");
        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 280, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Update & Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulse += 0.035;

        // Smooth sinusoidal drift
        n.x += n.vx + Math.sin(time + n.pulse) * 0.22;
        n.y += n.vy + Math.cos(time + n.pulse) * 0.22;

        // Boundary wrap
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;

        // Proximity to cursor
        let mouseDist = 999;
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          mouseDist = Math.sqrt(dx * dx + dy * dy);
        }
        const isNearCursor = mouseDist < 180;
        const prox = isNearCursor ? 1 - mouseDist / 180 : 0;

        // Inter-node Connection Lines
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 160) {
            const alpha = (1 - dist / 160) * (isDark ? 0.22 : 0.16) + (prox * 0.18);
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${alpha})`
              : `rgba(0, 0, 0, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();

            // Spawn data packet
            if (packets.length < maxPackets && Math.random() < 0.004) {
              packets.push({
                fromIndex: i,
                toIndex: j,
                progress: 0,
                speed: 0.007 + Math.random() * 0.01,
              });
            }
          }
        }

        // Draw Node Square / Diamond
        const nodeSize = n.size + prox * 2.5;
        const nodeAlpha = isDark ? 0.7 + prox * 0.3 : 0.6 + prox * 0.35;
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${nodeAlpha})`
          : `rgba(0, 0, 0, ${nodeAlpha})`;
        ctx.fillRect(n.x - nodeSize / 2, n.y - nodeSize / 2, nodeSize, nodeSize);

        // Pulse ring around node
        const ringRadius = nodeSize * 2.0 + Math.sin(n.pulse) * 3.5;
        ctx.strokeStyle = isDark
          ? `rgba(255, 255, 255, ${0.16 + prox * 0.25})`
          : `rgba(0, 0, 0, ${0.12 + prox * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Monospace Telemetry Label
        if (n.label) {
          ctx.font = "bold 9px ui-monospace, SFMono-Regular, Menlo, monospace";
          const labelAlpha = isDark ? 0.45 + prox * 0.45 : 0.45 + prox * 0.45;
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${labelAlpha})`
            : `rgba(0, 0, 0, ${labelAlpha})`;
          ctx.fillText(`[${n.label}]`, n.x + 9, n.y + 3);
        }
      }

      // 4. Draw Traveling Data Packets
      for (let k = packets.length - 1; k >= 0; k--) {
        const pkt = packets[k];
        pkt.progress += pkt.speed;

        const src = nodes[pkt.fromIndex];
        const tgt = nodes[pkt.toIndex];

        if (!src || !tgt || pkt.progress >= 1) {
          packets.splice(k, 1);
          continue;
        }

        const currX = src.x + (tgt.x - src.x) * pkt.progress;
        const currY = src.y + (tgt.y - src.y) * pkt.progress;

        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(currX - 2.5, currY - 2.5, 5, 5);

        // Glowing packet trail
        const trailProg = Math.max(0, pkt.progress - 0.09);
        const trailX = src.x + (tgt.x - src.x) * trailProg;
        const trailY = src.y + (tgt.y - src.y) * trailProg;

        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(currX, currY);
        ctx.stroke();
      }

      // 5. Cursor Crosshair & Coordinate Readout
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(mouse.x - 14, mouse.y);
        ctx.lineTo(mouse.x + 14, mouse.y);
        ctx.moveTo(mouse.x, mouse.y - 14);
        ctx.lineTo(mouse.x, mouse.y + 14);
        ctx.stroke();

        ctx.font = "8px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";
        ctx.fillText(`LOC:[${Math.round(mouse.x)},${Math.round(mouse.y)}]`, mouse.x + 10, mouse.y - 8);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [mounted]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Engineering Coordinate Grid */}
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

      {/* 3. Ambient Lighting Glow */}
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
