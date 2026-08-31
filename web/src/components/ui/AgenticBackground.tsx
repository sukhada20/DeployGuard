"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

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

function drawRadarBeam(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scanY: number,
  isDark: boolean
) {
  const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  scanGrad.addColorStop(0, "transparent");
  scanGrad.addColorStop(0.5, isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)");
  scanGrad.addColorStop(1, "transparent");
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanY - 30, width, 60);
}

function drawSpotlight(
  ctx: CanvasRenderingContext2D,
  mouse: { x: number; y: number },
  isDark: boolean
) {
  const spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 320);
  spotGrad.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(0, 0, 0, 0.08)");
  spotGrad.addColorStop(1, "transparent");
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 320, 0, Math.PI * 2);
  ctx.fill();
}

function updateNodePhysics(n: Node, time: number, width: number, height: number, isDashboard: boolean) {
  n.pulse += isDashboard ? 0.025 : 0.035;
  n.x += n.vx + Math.sin(time + n.pulse) * (isDashboard ? 0.16 : 0.25);
  n.y += n.vy + Math.cos(time + n.pulse) * (isDashboard ? 0.16 : 0.25);

  if (n.x < -20) n.x = width + 20;
  if (n.x > width + 20) n.x = -20;
  if (n.y < -20) n.y = height + 20;
  if (n.y > height + 20) n.y = -20;
}

function computeMouseProximity(n: Node, mouse: { x: number; y: number; active: boolean }, isDashboard: boolean): number {
  if (!mouse.active || isDashboard) return 0;
  const dx = n.x - mouse.x;
  const dy = n.y - mouse.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < 200 ? 1 - dist / 200 : 0;
}

function drawInterNodeLinks(
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  i: number,
  packets: Packet[],
  maxPackets: number,
  speedScale: number,
  isDashboard: boolean,
  isDark: boolean,
  prox: number
) {
  const n = nodes[i];
  const maxDist = isDashboard ? 150 : 170;

  for (let j = i + 1; j < nodes.length; j++) {
    const n2 = nodes[j];
    const dx = n.x - n2.x;
    const dy = n.y - n2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < maxDist) {
      const lineBaseAlpha = isDark
        ? (isDashboard ? 0.18 : 0.35)
        : (isDashboard ? 0.25 : 0.32);

      const alpha = (1 - dist / maxDist) * lineBaseAlpha + prox * 0.2;
      ctx.strokeStyle = isDark
        ? `rgba(255, 255, 255, ${alpha})`
        : `rgba(0, 0, 0, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(n.x, n.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();

      if (packets.length < maxPackets && Math.random() < (isDashboard ? 0.003 : 0.006)) {
        packets.push({
          fromIndex: i,
          toIndex: j,
          progress: 0,
          speed: (0.006 + Math.random() * 0.01) * speedScale,
        });
      }
    }
  }
}

function drawSingleNode(
  ctx: CanvasRenderingContext2D,
  n: Node,
  prox: number,
  isDashboard: boolean,
  isDark: boolean
) {
  const nodeSize = n.size + prox * 2;
  const nodeAlpha = isDark
    ? (isDashboard ? 0.55 : 0.85 + prox * 0.15)
    : (isDashboard ? 0.65 : 0.85 + prox * 0.15);

  ctx.fillStyle = isDark
    ? `rgba(255, 255, 255, ${nodeAlpha})`
    : `rgba(0, 0, 0, ${nodeAlpha})`;
  ctx.fillRect(n.x - nodeSize / 2, n.y - nodeSize / 2, nodeSize, nodeSize);

  if (!isDashboard) {
    const ringRadius = nodeSize * 2.2 + Math.sin(n.pulse) * 4;
    ctx.strokeStyle = isDark
      ? `rgba(255, 255, 255, ${0.25 + prox * 0.3})`
      : `rgba(0, 0, 0, ${0.2 + prox * 0.25})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(n.x, n.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (n.label) {
    ctx.font = "bold 9px ui-monospace, SFMono-Regular, Menlo, monospace";
    const labelAlpha = isDark
      ? (isDashboard ? 0.45 : 0.65 + prox * 0.35)
      : (isDashboard ? 0.55 : 0.7 + prox * 0.3);
    ctx.fillStyle = isDark
      ? `rgba(255, 255, 255, ${labelAlpha})`
      : `rgba(0, 0, 0, ${labelAlpha})`;
    ctx.fillText(`[${n.label}]`, n.x + 8, n.y + 3);
  }
}

function drawNodesAndLinks(
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  packets: Packet[],
  mouse: { x: number; y: number; active: boolean },
  time: number,
  width: number,
  height: number,
  maxPackets: number,
  speedScale: number,
  isDashboard: boolean,
  isDark: boolean
) {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    updateNodePhysics(n, time, width, height, isDashboard);
    const prox = computeMouseProximity(n, mouse, isDashboard);
    drawInterNodeLinks(ctx, nodes, i, packets, maxPackets, speedScale, isDashboard, isDark, prox);
    drawSingleNode(ctx, n, prox, isDashboard, isDark);
  }
}

function drawPackets(
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  packets: Packet[],
  isDashboard: boolean,
  isDark: boolean
) {
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

    const packetAlpha = isDark ? (isDashboard ? 0.7 : 1.0) : (isDashboard ? 0.8 : 0.95);
    ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${packetAlpha})` : `rgba(0, 0, 0, ${packetAlpha})`;
    ctx.fillRect(currX - 2.5, currY - 2.5, 5, 5);

    // Packet Trail
    const trailProg = Math.max(0, pkt.progress - 0.1);
    const trailX = src.x + (tgt.x - src.x) * trailProg;
    const trailY = src.y + (tgt.y - src.y) * trailProg;

    const trailAlpha = isDark ? (isDashboard ? 0.35 : 0.5) : (isDashboard ? 0.45 : 0.6);
    ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${trailAlpha})` : `rgba(0, 0, 0, ${trailAlpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(trailX, trailY);
    ctx.lineTo(currX, currY);
    ctx.stroke();
  }
}

export function AgenticBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

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

    // Node count
    const baseDensity = isDashboard ? 28000 : 20000;
    const minNodes = isDashboard ? 22 : 32;
    const maxNodes = isDashboard ? 36 : 52;
    const nodeCount = Math.max(minNodes, Math.min(maxNodes, Math.floor((width * height) / baseDensity)));
    const speedScale = isDashboard ? 0.6 : 1.0;

    const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45 * speedScale,
      vy: (Math.random() - 0.5) * 0.45 * speedScale,
      size: isDashboard ? 3.5 : (Math.random() > 0.5 ? 5.5 : 4),
      pulse: Math.random() * Math.PI * 2,
      label: (!isDashboard || i < 4) ? LABELS[i % LABELS.length] : undefined,
    }));

    const packets: Packet[] = [];
    const maxPackets = isDashboard ? 8 : 18;
    let time = 0;
    let scanY = 0;

    const loop = () => {
      if (!isRunning) return;

      time += isDashboard ? 0.014 : 0.02;
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");

      // Smooth cursor interpolation
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      }

      // 1. Moving Telemetry Radar Beam
      if (!isDashboard) {
        scanY = (scanY + 0.9) % height;
        drawRadarBeam(ctx, width, height, scanY, isDark);
      }

      // 2. Cursor Ambient Spotlight
      if (mouse.active && mouse.x > 0 && mouse.y > 0 && !isDashboard) {
        drawSpotlight(ctx, mouse, isDark);
      }

      // 3. Update & Draw Nodes
      drawNodesAndLinks(ctx, nodes, packets, mouse, time, width, height, maxPackets, speedScale, isDashboard, isDark);

      // 4. Draw Traveling Data Packets
      drawPackets(ctx, nodes, packets, isDashboard, isDark);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [mounted, isDashboard]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Engineering Coordinate Grid: crisp visibility in light and dark mode */}
      <div
        className="absolute inset-0 transition-opacity duration-1500 ease-out"
        style={{
          opacity: mounted ? (isDashboard ? 0.15 : 0.20) : 0,
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 3%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 84%, rgba(0,0,0,0.1) 92%, rgba(0,0,0,0.4) 97%, rgba(0,0,0,1) 100%)",
          WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 3%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 84%, rgba(0,0,0,0.1) 92%, rgba(0,0,0,0.4) 97%, rgba(0,0,0,1) 100%)",
        }}
      />

      {/* 2. Ambient Lighting Glow Orbs */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-foreground/${isDashboard ? "[0.03]" : "[0.045]"} rounded-full blur-[140px] pointer-events-none`} />

      {/* 3. Canvas Node Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
