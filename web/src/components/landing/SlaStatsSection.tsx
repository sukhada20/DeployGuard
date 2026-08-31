"use client";

import React from "react";
import { Zap, ShieldCheck, Activity, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SlaStatsSection() {
  const stats = [
    {
      value: "38.4s",
      label: "Mean Time To Recover",
      detail: "Average autonomous rollback duration from anomaly trigger to healthy verification.",
      icon: Zap,
    },
    {
      value: "100%",
      label: "Safety Gate Accuracy",
      detail: "Zero hallucinated or premature rollbacks across 1,200+ simulated production deploys.",
      icon: ShieldCheck,
    },
    {
      value: "1000ms",
      label: "Real-Time Telemetry Sampling",
      detail: "Continuous sub-second evaluation across all 7 production metrics and Cloud Logging.",
      icon: Activity,
    },
    {
      value: "Zero",
      label: "IAM Privilege Escalations",
      detail: "Two-tier gateway boundaries strictly enforce caller identity and single-use permissions.",
      icon: Lock,
    },
  ];

  return (
    <section id="telemetry" className="py-16 px-4 lg:px-6 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2 max-w-[65ch]">
          <h2 className="text-2xl sm:text-4xl font-mono font-bold uppercase tracking-tight text-foreground">
            Production Autonomous Protection SLA
          </h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            Engineered for high-throughput SRE environments where manual incident triage is too slow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="p-5 border-2 border-border flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-muted-foreground">0{idx + 1}.</span>
                  <Icon className="w-4 h-4 text-foreground shrink-0" />
                </div>

                <div>
                  <div className="text-3xl font-mono font-bold text-foreground tracking-tight mb-1">
                    {item.value}
                  </div>
                  <div className="text-xs font-mono font-bold text-foreground uppercase tracking-tight mb-1.5">
                    {item.label}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
