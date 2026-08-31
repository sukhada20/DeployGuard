"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function LandingHeader() {
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand without wrapping icon div */}
        <Link href="/" className="flex items-center gap-2 group">
          <ShieldCheck className="w-5 h-5 text-foreground transition-transform group-hover:scale-105" />
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm tracking-tight text-foreground uppercase">
              DeployGuard
            </span>
            <Badge variant="brutalist" className="text-[9px] px-1.5 py-0 hidden sm:inline-flex">
              v1.0-fleet
            </Badge>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-muted-foreground">
          <a href="#architecture" className="hover:text-foreground transition-colors font-medium">
            Architecture
          </a>
          <a href="#telemetry" className="hover:text-foreground transition-colors font-medium">
            Telemetry SLA
          </a>
          <a href="#fleet" className="hover:text-foreground transition-colors font-medium">
            Fleet Agents
          </a>
          <a href="#governance" className="hover:text-foreground transition-colors font-medium">
            Governance Trace
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 border border-border bg-muted/40 text-[10px] font-mono text-foreground font-semibold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>SRE ARMORED</span>
          </div>

          <ThemeToggle />

          <Button
            variant="brutalistPrimary"
            size="sm"
            asChild
            className="h-8 text-xs font-mono gap-1.5"
          >
            <Link href="/dashboard">
              <span>Launch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
