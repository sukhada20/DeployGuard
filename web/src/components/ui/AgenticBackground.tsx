"use client";

import React, { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
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
  const mouseRef = useRef({
    targetX: -1000,
    targetY: -1000,
    currX: -1000,
    currY: -1000,
    active: false,
  });

  useEffect(() => {
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // Subtle technical telemetry tags
    const LABELS = [
      "deploy_monitor:active",
      "gemini:reasoning",
      "clouddeploy:armed",
      "otel:span_trace",
      "mttr:38.4s",
      "model_armor:secure",
      "firestore:vector_004",
      "policy:5_of_5_pass",
      "gke:gateway_verified",
      "run:sampling_1000ms",
    ];

    // Initialize Stable Network Nodes
    const count = Math.max(20, Math.min(36, Math.floor((width * height) / 32000)));
    const nodes: Node[] = Array.from({ length: count }, (_, i) => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() > 0.65 ? 2.5 : 1.5,
        label: i < LABELS.length ? LABELS[i] : undefined,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const packets: Packet[] = [];
    const maxPackets = 10;
    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");

      // Smooth mouse lerp (subtle inertia, no frame drops or resets)
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.currX += (mouse.targetX - mouse.currX) * 0.08;
        mouse.currY += (mouse.targetY - mouse.currY) * 0.08;
      }

      // 1. Crisp Architectural Grid Lines
      const gridSize = 72;
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.035)" : "rgba(0, 0, 0, 0.04)";
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

      // 2. Corner Crosshairs at Major Grid Intersections
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.14)";
      for (let x = 0; x < width; x += gridSize * 2) {
        for (let y = 0; y < height; y += gridSize * 2) {
          ctx.fillRect(x - 2.5, y, 6, 1);
          ctx.fillRect(x, y - 2.5, 1, 6);
        }
      }

      // 3. Ambient Mouse Radial Glow (toned down, pronounced & smooth)
      if (mouse.active && mouse.currX > 0 && mouse.currY > 0) {
        const glow = ctx.createRadialGradient(
          mouse.currX,
          mouse.currY,
          0,
          mouse.currX,
          mouse.currY,
          220
        );
        glow.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.045)" : "rgba(0, 0, 0, 0.035)");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mouse.currX, mouse.currY, 220, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Update & Draw Agent Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Smooth continuous drift with harmonic sine floating
        node.x += node.vx + Math.sin(time + node.phase) * 0.15;
        node.y += node.vy + Math.cos(time + node.phase) * 0.15;

        // Wrap-around screen bounds
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        // Check distance to smoothed cursor
        let mouseDist = 999;
        if (mouse.active) {
          const dx = node.x - mouse.currX;
          const dy = node.y - mouse.currY;
          mouseDist = Math.sqrt(dx * dx + dy * dy);
        }
        const isNearMouse = mouseDist < 160;
        const proximityRatio = isNearMouse ? 1 - mouseDist / 160 : 0;

        // Node fill color (pronounces slightly when near cursor)
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${0.45 + proximityRatio * 0.4})`
          : `rgba(0, 0, 0, ${0.45 + proximityRatio * 0.35})`;

        const renderSize = node.size + proximityRatio * 1.5;
        ctx.fillRect(node.x - renderSize / 2, node.y - renderSize / 2, renderSize, renderSize);

        // Draw Telemetry Tag
        if (node.label) {
          ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${0.3 + proximityRatio * 0.45})`
            : `rgba(0, 0, 0, ${0.4 + proximityRatio * 0.4})`;
          ctx.fillText(`[${node.label}]`, node.x + 6, node.y + 3);
        }

        // Draw Inter-Node Connection Lines
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 160) {
            const alphaRatio = 1 - dist / 160;
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${0.05 + alphaRatio * 0.14})`
              : `rgba(0, 0, 0, ${0.04 + alphaRatio * 0.12})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();

            // Spawn data packet along active connection
            if (packets.length < maxPackets && Math.random() < 0.003) {
              packets.push({
                fromIndex: i,
                toIndex: j,
                progress: 0,
                speed: 0.006 + Math.random() * 0.008,
              });
            }
          }
        }
      }

      // 5. Draw Animated Data Packets (Smooth motion along links)
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

        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Run ONCE on mount, NEVER teardown on mousemove!

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
