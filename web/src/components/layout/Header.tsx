"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Server, Home } from "lucide-react";
import { DashboardOverview } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  overview?: DashboardOverview;
  isSseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ overview, isSseConnected }) => {
  const isIncident = overview?.system_status === "INCIDENT_ACTIVE";
  const dep = overview?.active_deployment;

  return (
    <header className="border-b border-border bg-background sticky top-0 z-40 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand without wrapping div around icon */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <Link href="/" className="flex items-center gap-2 group">
            <ShieldCheck className="w-5 h-5 text-foreground transition-transform group-hover:scale-105" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-tight text-foreground uppercase">
                  DeployGuard
                </span>
                <Badge variant="brutalist" className="text-[9px] px-1.5 py-0 hidden sm:inline-flex">
                  CONSOLE
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Autonomous SRE Governance Cockpit
              </p>
            </div>
          </Link>

          {/* Return to Overview Link */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-7 text-[11px] font-mono gap-1 border-border hover:border-foreground"
          >
            <Link href="/">
              <Home className="w-3 h-3" />
              <span>Overview</span>
            </Link>
          </Button>

          {/* Mobile Theme */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Center: Active Pipeline Strip */}
        <div className="flex items-center gap-2.5 bg-muted/40 border border-border px-3 py-1 text-xs font-mono w-full md:w-auto justify-center">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Server className="w-3.5 h-3.5 text-foreground" />
            <span className="text-foreground font-bold">{dep?.service_name || "checkout-service"}</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1">
            <span className="text-foreground font-semibold">{dep?.target_version || "v2.4.0"}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground font-semibold">{dep?.stable_version || "v2.3.9"}</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px]">STATUS:</span>
            <span
              className={`uppercase font-bold ${
                isIncident
                  ? "text-rose-600 dark:text-rose-400 animate-pulse"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {dep?.pipeline_status || "monitoring"}
            </span>
          </div>
        </div>

        {/* Right: Health Badge, SSE indicator & Theme Toggle */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Status Badge */}
          {isIncident ? (
            <Badge variant="destructive" className="h-7 px-2.5 gap-1.5 font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>INCIDENT ACTIVE</span>
            </Badge>
          ) : (
            <Badge variant="success" className="h-7 px-2.5 gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FLEET ARMORED</span>
            </Badge>
          )}

          {/* Live SSE Stream */}
          <div className="flex items-center gap-1.5 px-2.5 h-7 border border-border bg-muted/40 text-[11px] font-mono text-foreground font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                isSseConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>{isSseConnected ? "LIVE SSE" : "OFFLINE"}</span>
          </div>

          {/* Theme Switcher */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
