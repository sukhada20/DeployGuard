"use client";

import React, { useEffect, useRef, useState } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  label?: string;
  phase: number;
}

interface Packet {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
}

export function AgenticBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const mouseRef = useRef({
    targetX: -1000,
    targetY: -1000,
    currX: -1000,
    currY: -1000,
    active: false,
  });

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.active = true;
      if (mouseRef.current.currX < 0) {
        mouseRef.current.currX = e.clientX;
        mouseRef.current.currY = e.clientY;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // SRE & Agent telemetry labels
    const LABELS = [
      "agent:deploy_monitor",
      "gemini:reasoning_engine",
      "cloud_deploy:armed",
      "otel:span_0x4f92",
      "mttr:38.4s",
      "model_armor:active",
      "firestore:vector_004",
      "policy:5_of_5_pass",
      "gke:ingress_ok",
      "telemetry:sampling_1000ms",
      "rollback:target_v2.3.9",
      "status:autonomous_active",
    ];

    // Generate balanced network nodes
    const nodeCount = Math.max(24, Math.min(40, Math.floor((width * height) / 26000)));
    const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() > 0.6 ? 4 : 2.5,
      label: i < LABELS.length ? LABELS[i] : undefined,
      phase: Math.random() * Math.PI * 2,
    }));

    const packets: Packet[] = [];
    const maxPackets = 14;
    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");

      // Smooth mouse lerp
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.currX += (mouse.targetX - mouse.currX) * 0.06;
        mouse.currY += (mouse.targetY - mouse.currY) * 0.06;
      }

      // 1. Draw Subtle Ambient Spotlight around Mouse
      if (mouse.active && mouse.currX > 0 && mouse.currY > 0) {
        const glow = ctx.createRadialGradient(
          mouse.currX,
          mouse.currY,
          0,
          mouse.currX,
          mouse.currY,
          260
        );
        glow.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mouse.currX, mouse.currY, 260, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Update and Draw Nodes & Connecting Links
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Smooth sinusoidal floating
        node.x += node.vx + Math.sin(time + node.phase) * 0.2;
        node.y += node.vy + Math.cos(time + node.phase) * 0.2;

        // Wrap around bounds
        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;

        // Distance to smooth mouse
        let mouseDist = 999;
        if (mouse.active) {
          const dx = node.x - mouse.currX;
          const dy = node.y - mouse.currY;
          mouseDist = Math.sqrt(dx * dx + dy * dy);
        }
        const isNearMouse = mouseDist < 180;
        const proximityRatio = isNearMouse ? 1 - mouseDist / 180 : 0;

        // Draw connections to nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 170) {
            const alphaRatio = 1 - dist / 170;
            const lineAlpha = (isDark ? 0.08 : 0.07) + alphaRatio * (isDark ? 0.22 : 0.18);

            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${lineAlpha})`
              : `rgba(0, 0, 0, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();

            // Spawn data packet along connection line
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

        // Draw Node Point & Halo
        const nodeAlpha = (isDark ? 0.55 : 0.5) + proximityRatio * 0.45;
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${nodeAlpha})`
          : `rgba(0, 0, 0, ${nodeAlpha})`;

        const r = node.size + proximityRatio * 2;
        ctx.fillRect(node.x - r / 2, node.y - r / 2, r, r);

        // Subtle outer pulse halo
        if (node.size > 3 || isNearMouse) {
          ctx.strokeStyle = isDark
            ? `rgba(255, 255, 255, ${0.15 + proximityRatio * 0.3})`
            : `rgba(0, 0, 0, ${0.12 + proximityRatio * 0.25})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4 + Math.sin(time * 2 + node.phase) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw Monospace Telemetry Label
        if (node.label) {
          ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
          const textAlpha = (isDark ? 0.35 : 0.4) + proximityRatio * 0.5;
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${textAlpha})`
            : `rgba(0, 0, 0, ${textAlpha})`;
          ctx.fillText(`[${node.label}]`, node.x + 8, node.y + 3);
        }
      }

      // 3. Draw Traveling Data Packets
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

        // Bright packet
        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(px - 2, py - 2, 4, 4);

        // Packet tracer trail
        const trailProgress = Math.max(0, pkt.progress - 0.05);
        const tx = from.x + (to.x - from.x) * trailProgress;
        const ty = from.y + (to.y - from.y) * trailProgress;
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Visible CSS Architectural Grid */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* 2. Micro Dot Matrix Pattern */}
      <div
        className="absolute inset-0 opacity-[0.12] dark:opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1.2px, transparent 1.2px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* 3. Deep Ambient Atmospheric Depth Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-foreground/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-foreground/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* 4. Live Canvas Node & Telemetry Stream */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* 5. Peripheral Corner HUD Coordinates */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-muted-foreground/50 tracking-wider hidden md:block">
        + 0x00_FLEET_ROOT · AUTONOMOUS_GOVERNANCE
      </div>
      <div className="absolute top-3 right-4 font-mono text-[9px] text-muted-foreground/50 tracking-wider hidden md:block">
        OTEL_SPAN_STREAM · SAMPLING_1000MS +
      </div>
      <div className="absolute bottom-3 left-4 font-mono text-[9px] text-muted-foreground/50 tracking-wider hidden md:block">
        + GKE_CLOUD_DEPLOY · ARMORED_GATEWAY
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-muted-foreground/50 tracking-wider hidden md:block">
        VERTEX_EMBED_004 · 5_OF_5_POLICIES_PASS +
      </div>
    </div>
  );
}
