"use client";

import React, { useState } from "react";
import {
  Gauge,
  Database,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FeatureBento() {
  const [spikeMultiplier, setSpikeMultiplier] = useState(1);

  const errorRate = +(0.01 * spikeMultiplier).toFixed(3);
  const latency = Math.round(120 * (1 + (spikeMultiplier - 1) * 0.4));
  const isSpike = spikeMultiplier > 1.25;

  return (
    <section id="architecture" className="py-16 px-4 lg:px-6 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="space-y-2 max-w-[65ch]">
          <h2 className="text-2xl sm:text-4xl font-mono font-bold uppercase tracking-tight text-foreground">
            Architecture and Governance Engine
          </h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            Five autonomous agents orchestrated across real-time Google Cloud telemetry, deterministic policy evaluation, and two-tier IAM safety gates.
          </p>
        </div>

        {/* 4-Cell Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cell 1: 7-Dimension Telemetry Engine */}
          <Card className="p-5 border-2 border-border hover:border-foreground/80 transition-colors flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-foreground shrink-0" />
                  <h3 className="font-mono font-bold text-xs uppercase tracking-tight text-foreground">
                    01. 7-Dimension Telemetry Anomaly Engine
                  </h3>
                </div>
                {isSpike ? (
                  <Badge variant="destructive" className="text-[9px]">CRITICAL SPIKE</Badge>
                ) : (
                  <Badge variant="success" className="text-[9px]">NOMINAL</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-sans">
                Statistical deviation detection across Error Rate, P95 Latency, CPU, Memory, Crash Count, Restart Count, and Request Rate at 1000ms sampling.
              </p>
            </div>

            {/* Interactive Telemetry Slider */}
            <div className="p-3.5 border border-border bg-muted/20 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">SIMULATE ANOMALY LOAD:</span>
                <span className="font-bold text-foreground">{spikeMultiplier}x Multiplier</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="0.5"
                value={spikeMultiplier}
                onChange={(e) => setSpikeMultiplier(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-none accent-foreground cursor-pointer"
              />
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 border border-border bg-card">
                  <div className="text-[10px] text-muted-foreground">HTTP Error Rate:</div>
                  <div className={`font-bold ${isSpike ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
                    {errorRate} ({spikeMultiplier}x)
                  </div>
                </div>
                <div className="p-2 border border-border bg-card">
                  <div className="text-[10px] text-muted-foreground">P95 Latency:</div>
                  <div className={`font-bold ${isSpike ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
                    {latency}ms
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Cell 2: Vertex AI Vector Memory */}
          <Card className="p-5 border-2 border-border hover:border-foreground/80 transition-colors flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-foreground shrink-0" />
                  <h3 className="font-mono font-bold text-xs uppercase tracking-tight text-foreground">
                    02. Vertex AI Incident Vector Memory
                  </h3>
                </div>
                <Badge variant="brutalist" className="text-[9px]">RAG MATCH: 0.94</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-sans">
                Embeds deployment events via text-embedding-004 and retrieves analogous past incident resolutions with Cosine similarity thresholding.
              </p>
            </div>

            <div className="p-3.5 border border-border bg-muted/20 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] border-b border-border/60 pb-1.5">
                <span className="text-muted-foreground">TOP HISTORICAL MATCH:</span>
                <span className="font-bold text-foreground">inc-checkout-dep-9942</span>
              </div>
              <div className="text-[11px] text-foreground space-y-1">
                <div>Similarity: <span className="font-bold text-foreground">94.2%</span></div>
                <div>Root Cause: <span className="text-muted-foreground">DB connection pool exhaustion</span></div>
                <div>Prior Resolution: <span className="font-bold text-emerald-600 dark:text-emerald-400">Rollback to v2.3.9</span></div>
              </div>
            </div>
          </Card>

          {/* Cell 3: Deterministic 5-Rule Safety Policy */}
          <Card className="p-5 border-2 border-border hover:border-foreground/80 transition-colors flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-foreground shrink-0" />
                  <h3 className="font-mono font-bold text-xs uppercase tracking-tight text-foreground">
                    03. Deterministic 5-Rule Policy Gate
                  </h3>
                </div>
                <Badge variant="success" className="text-[9px]">5/5 PASS</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-sans">
                Non-LLM deterministic code gates evaluate every rollback recommendation to ensure zero hallucinations and safe rollback execution.
              </p>
            </div>

            <div className="p-3 border border-border bg-muted/20 space-y-1.5 font-mono text-[11px]">
              {[
                { name: "no_concurrent_rollbacks", label: "No Concurrent Rollbacks", ok: true },
                { name: "iam_authorization_verified", label: "Two-Tier IAM Authorization", ok: true },
                { name: "target_stable_version_valid", label: "Stable Target Version Validated", ok: true },
                { name: "error_delta_threshold_exceeded", label: "Delta Threshold Exceeded (1.25x)", ok: true },
                { name: "recovery_probe_readiness", label: "Recovery Probes Configured", ok: true },
              ].map((rule) => (
                <div key={rule.name} className="flex items-center justify-between">
                  <span className="text-foreground">{rule.label}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">PASS</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Cell 4: Two-Tier Agent Gateway & Model Armor */}
          <Card className="p-5 border-2 border-border hover:border-foreground/80 transition-colors flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-foreground shrink-0" />
                  <h3 className="font-mono font-bold text-xs uppercase tracking-tight text-foreground">
                    04. Two-Tier Gateway and Model Armor
                  </h3>
                </div>
                <Badge variant="brutalist" className="text-[9px]">ISOLATED</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-sans">
                Each agent executes under a dedicated Google Cloud Service Account. Model Armor screens all prompts and inputs for injection threats.
              </p>
            </div>

            <div className="p-3 border border-border bg-muted/20 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">CALLER IDENTITY:</span>
                <span className="text-foreground font-bold">decision-agent-sa@gcp</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">PERMITTED TOOL:</span>
                <span className="text-foreground font-bold">clouddeploy.rollback</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">PROMPT INJECTION DEFENSE:</span>
                <span className="text-foreground font-bold">Model Armor Filtered</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
