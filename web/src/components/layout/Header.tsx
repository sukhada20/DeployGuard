"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Radio, Activity, Cpu, Server } from "lucide-react";
import { DashboardOverview } from "@/types/api";

interface HeaderProps {
  overview?: DashboardOverview;
  isSseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ overview, isSseConnected }) => {
  const isIncident = overview?.system_status === "INCIDENT_ACTIVE";
  const dep = overview?.active_deployment;

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3.5">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 text-primary">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                DeployGuard
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                v1.0-fleet
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Autonomous Governed Safe-Deployment Fleet</p>
          </div>
        </div>

        {/* Center: Active Deployment & Pipeline Status */}
        <div className="flex items-center gap-4 bg-background/60 border border-border/80 px-4 py-1.5 rounded-full text-xs font-mono">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground font-semibold">{dep?.service_name || "checkout-service"}</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400">{dep?.target_version || "v2.4.0"}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-emerald-400">{dep?.stable_version || "v2.3.9"}</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Status:</span>
            <span className={`uppercase font-bold ${
              isIncident ? "text-rose-400 animate-pulse" : "text-emerald-400"
            }`}>
              {dep?.pipeline_status || "monitoring"}
            </span>
          </div>
        </div>

        {/* Right: Telemetry Health & SSE Stream Indicator */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
            isIncident 
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 glow-rose" 
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 glow-emerald"
          }`}>
            {isIncident ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{isIncident ? "INCIDENT ACTIVE" : "FLEET ARMORED"}</span>
          </div>

          {/* SSE Live Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-muted/60 border border-border text-muted-foreground">
            <Radio className={`w-3 h-3 ${isSseConnected ? "text-emerald-400 animate-pulse" : "text-rose-400"}`} />
            <span>{isSseConnected ? "LIVE SSE" : "OFFLINE"}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
