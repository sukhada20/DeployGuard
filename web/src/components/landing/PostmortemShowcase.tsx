"use client";

import React from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PostmortemShowcase() {
  return (
    <section className="py-16 px-4 lg:px-6 border-b border-border bg-transparent">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="space-y-2 max-w-[65ch]">
          <h2 className="text-2xl sm:text-4xl font-mono font-bold uppercase tracking-tight text-foreground">
            Automated SRE Postmortem Synthesis
          </h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            Immediately upon recovery, DeployGuard synthesizes an auditable postmortem document with 5-Whys root cause analysis and preventative action items.
          </p>
        </div>

        {/* Postmortem Document Preview */}
        <Card className="p-6 border-2 border-border bg-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="destructive" className="text-[9px]">CRITICAL</Badge>
                <Badge variant="success" className="text-[9px]">RECOVERED</Badge>
                <span className="font-mono text-xs text-muted-foreground">ID: pm-checkout-service-dep-9942</span>
              </div>
              <h3 className="font-mono font-bold text-base uppercase text-foreground">
                Incident Postmortem: checkout-service
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Target: v2.4.0 (Degraded) → Restored: v2.3.9 (Stable) | MTTR: 38.4s
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-mono gap-1 border-border hover:border-foreground"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Markdown</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {/* Executive Summary & 5-Whys */}
            <div className="space-y-3">
              <div className="p-3.5 border border-border bg-muted/20 space-y-1.5">
                <h4 className="font-mono font-bold uppercase text-foreground">
                  Executive Summary
                </h4>
                <p className="text-muted-foreground font-sans leading-relaxed">
                  At 13:44:30Z, target deployment v2.4.0 triggered a 14.5x spike in HTTP error rates due to database connection timeouts. The autonomous Decision Agent authorized an automated Cloud Deploy rollback to stable release v2.3.9. Telemetry metrics fully recovered within 38.4 seconds.
                </p>
              </div>

              <div className="p-3.5 border border-border bg-muted/20 space-y-1.5 font-mono">
                <h4 className="font-bold uppercase text-foreground">
                  Root Cause Analysis (5-Whys)
                </h4>
                <div className="text-muted-foreground text-[11px] leading-relaxed space-y-1">
                  <div>1. Why did errors spike? DB connection pool exhausted.</div>
                  <div>2. Why was pool exhausted? Default max_connections was set to 10 in v2.4.0.</div>
                  <div>3. Why was it 10? Database migration script reverted helm value override.</div>
                  <div>4. Why did test pass? Staging environment had low concurrent traffic.</div>
                  <div>5. Root cause: Configuration drift between staging and prod Helm charts.</div>
                </div>
              </div>
            </div>

            {/* Telemetry Delta Table & Preventative Action Items */}
            <div className="space-y-3">
              <div className="p-3.5 border border-border bg-muted/20 space-y-2">
                <h4 className="font-mono font-bold uppercase text-foreground">
                  Telemetry Evidence Deltas
                </h4>
                <div className="font-mono text-[11px] space-y-1.5">
                  <div className="flex justify-between border-b border-border/60 pb-1 text-muted-foreground">
                    <span>Metric</span>
                    <span>Baseline</span>
                    <span>Peak</span>
                    <span>Verdict</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground">Error Rate</span>
                    <span className="text-muted-foreground">0.010</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">0.145 (+1350%)</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">SPIKE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground">P95 Latency</span>
                    <span className="text-muted-foreground">120ms</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">480ms (+300%)</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">SPIKE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground">Memory Util</span>
                    <span className="text-muted-foreground">58%</span>
                    <span className="text-foreground font-semibold">64% (+10%)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">NOMINAL</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 border border-border bg-muted/20 space-y-2 font-sans">
                <h4 className="font-mono font-bold uppercase text-foreground">
                  Preventative Action Items
                </h4>
                <div className="space-y-1.5 text-foreground/90 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Add Helm chart schema validation for database connection pools in CI.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Enforce DeployGuard canary rollback gate in staging environments.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
