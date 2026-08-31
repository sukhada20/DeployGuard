"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card text-foreground">
      {/* Big Bold CTA Block */}
      <div className="py-16 px-4 lg:px-6 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-4xl font-mono font-bold uppercase tracking-tight text-foreground">
              Arm Your Production Cloud Deployments
            </h3>
            <p className="text-sm text-muted-foreground font-sans max-w-[60ch]">
              Experience autonomous anomaly detection, deterministic policy gating, and Cloud Deploy automated rollbacks in your environment.
            </p>
          </div>

          <Button
            variant="brutalistPrimary"
            size="lg"
            asChild
            className="h-11 px-6 text-xs font-mono font-bold uppercase gap-2 shrink-0"
          >
            <Link href="/dashboard">
              <span>Open Fleet Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="max-w-7xl mx-auto py-8 px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-foreground" />
          <span className="font-bold text-foreground">DEPLOYGUARD</span>
          <span>(v1.0-fleet)</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Live Console
          </Link>
          <a
            href="https://cloud.google.com/deploy"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Cloud Deploy
          </a>
          <a
            href="https://cloud.google.com/monitoring"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Cloud Monitoring
          </a>
        </div>

        <div className="text-[11px]">
          Deterministic SRE Fleet for Google Cloud Platform.
        </div>
      </div>
    </footer>
  );
}
