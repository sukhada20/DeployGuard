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
    <header className="border-b border-border bg-background/85 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <Link href="/" className="flex items-center gap-2.5 group">
            <ShieldCheck className="w-6 h-6 text-foreground transition-transform group-hover:scale-105" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base tracking-tight text-foreground uppercase">
                  DeployGuard
                </span>
                <Badge variant="brutalist" className="text-[10px] px-1.5 py-0.5 hidden sm:inline-flex font-mono font-bold">
                  CONSOLE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Autonomous SRE Governance Cockpit
              </p>
            </div>
          </Link>

          {/* Return to Overview Link */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 text-xs font-mono font-bold gap-1.5 border-border hover:border-foreground"
          >
            <Link href="/">
              <Home className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Link>
          </Button>

          {/* Mobile Theme */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Center: Active Pipeline Strip */}
        <div className="flex items-center gap-3 bg-muted/40 border-2 border-border px-3.5 py-1.5 text-xs font-mono w-full md:w-auto justify-center shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Server className="w-4 h-4 text-foreground" />
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
            <span className="text-muted-foreground text-xs font-bold">STATUS:</span>
            <span
              className={`uppercase font-bold ${
                isIncident
                  ? "text-rose-600 dark:text-rose-400 animate-pulse font-black"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {dep?.pipeline_status || "monitoring"}
            </span>
          </div>
        </div>

        {/* Right: Health Badge, SSE indicator & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          {/* Status Badge */}
          {isIncident ? (
            <Badge variant="destructive" className="h-8 px-3 gap-1.5 font-bold font-mono text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>INCIDENT ACTIVE</span>
            </Badge>
          ) : (
            <Badge variant="success" className="h-8 px-3 gap-1.5 font-bold font-mono text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>FLEET ARMORED</span>
            </Badge>
          )}

          {/* Live SSE Stream */}
          <div className="flex items-center gap-2 px-3 h-8 border-2 border-border bg-muted/40 text-xs font-mono text-foreground font-bold">
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
