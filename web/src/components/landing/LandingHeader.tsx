"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function LandingHeader() {
  return (
    <div className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full">
      <header className="border-2 border-border bg-card/90 backdrop-blur-md px-4 sm:px-6 py-2.5 shadow-2xl flex items-center justify-between gap-4">
        {/* Brand */}
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

        {/* Center Nav Links with Wipe Rectangle Hover */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-mono">
          {[
            { href: "#architecture", label: "Architecture" },
            { href: "#telemetry", label: "Telemetry SLA" },
            { href: "#fleet", label: "Fleet Agents" },
            { href: "#governance", label: "Governance Trace" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative overflow-hidden group px-3 py-1.5 border border-transparent hover:border-border transition-colors select-none"
            >
              <span className="absolute inset-0 bg-foreground translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out pointer-events-none" />
              <span className="relative z-10 text-muted-foreground group-hover:text-background font-bold transition-colors duration-200">
                {item.label}
              </span>
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 h-8 border-2 border-border bg-muted/30 text-xs font-mono text-foreground font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>SRE ARMORED</span>
          </div>

          <ThemeToggle />

          {/* Launch Console CTA with Wipe */}
          <Link
            href="/dashboard"
            className="relative overflow-hidden group h-8 px-3.5 border-2 border-foreground bg-foreground flex items-center gap-1.5 font-mono text-xs font-bold uppercase transition-colors select-none shadow-sm"
          >
            <span className="absolute inset-0 bg-background translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out pointer-events-none" />
            <span className="relative z-10 text-background group-hover:text-foreground transition-colors duration-200 flex items-center gap-1.5">
              <span>Launch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </header>
    </div>
  );
}
