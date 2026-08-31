"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Server, Home } from "lucide-react";
import { DashboardOverview } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  overview?: DashboardOverview;
  isSseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ overview, isSseConnected }) => {
  const isIncident = overview?.system_status === "INCIDENT_ACTIVE";
  const dep = overview?.active_deployment;

  return (
    <div className="sticky top-3 z-40 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full">
      <header className="border-2 border-border bg-card/90 backdrop-blur-md px-4 sm:px-6 py-2.5 shadow-2xl flex items-center justify-between gap-4">
        {/* Left: Brand & Overview button with Wipe Animation */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="relative overflow-hidden group px-2 py-1 flex items-center gap-2 border border-transparent hover:border-border transition-colors select-none"
          >
            <span className="absolute inset-0 bg-foreground translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out pointer-events-none" />
            <span className="relative z-10 text-foreground group-hover:text-background transition-colors duration-200 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span className="font-mono font-black text-sm tracking-tight uppercase">
                DeployGuard
              </span>
            </span>
          </Link>

          <Badge variant="brutalist" className="text-[10px] px-1.5 py-0.5 font-mono font-bold hidden sm:inline-flex">
            CONSOLE
          </Badge>

          {/* Overview button with Bottom-to-Top Wipe */}
          <Link
            href="/"
            className="relative overflow-hidden group h-8 px-3 border-2 border-border bg-card flex items-center gap-1.5 font-mono text-xs font-bold uppercase hover:border-foreground transition-colors select-none"
          >
            <span className="absolute inset-0 bg-foreground translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out pointer-events-none" />
            <span className="relative z-10 text-foreground group-hover:text-background transition-colors duration-200 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              <span>Overview</span>
            </span>
          </Link>
        </div>

        {/* Center: Minimal Active Service Strip */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 border-2 border-border bg-muted/30 text-xs font-mono">
          <Server className="w-3.5 h-3.5 text-foreground shrink-0" />
          <span className="font-bold text-foreground">{dep?.service_name || "checkout-service"}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{dep?.target_version || "v2.4.0"}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-foreground">{dep?.stable_version || "v2.3.9"}</span>
          <span className="text-muted-foreground">·</span>
          <span
            className={`font-bold uppercase ${
              isIncident
                ? "text-rose-600 dark:text-rose-400 animate-pulse font-black"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {dep?.pipeline_status || "monitoring"}
          </span>
        </div>

        {/* Right: Fleet Status, SSE Indicator & Monochrome Theme Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 h-8 border-2 border-border bg-muted/30 text-xs font-mono font-bold text-foreground">
            <span
              className={`w-2 h-2 rounded-full ${
                isIncident ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span className="hidden sm:inline">
              {isIncident ? "INCIDENT" : "FLEET ARMORED"}
            </span>
          </div>

          {/* Live SSE Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 h-8 border-2 border-border bg-muted/30 text-xs font-mono font-bold text-foreground">
            <span
              className={`w-2 h-2 rounded-full ${
                isSseConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>{isSseConnected ? "LIVE SSE" : "OFFLINE"}</span>
          </div>

          {/* Monochrome Icon-only Theme Toggle with Wipe Animation */}
          <ThemeToggle />
        </div>
      </header>
    </div>
  );
};
