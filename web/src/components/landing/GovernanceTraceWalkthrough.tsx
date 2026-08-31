"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Database,
  Brain,
  ShieldCheck,
  Lock,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TRACE_STEPS = [
  {
    step: "01",
    title: "Anomaly Trigger",
    actor: "Deploy Monitor Agent",
    icon: AlertTriangle,
    badge: "TRIGGER DETECTED",
    badgeVariant: "destructive" as const,
    summary: "HTTP error rate jumped from 0.010 baseline to 0.145 (14.5x spike) following v2.4.0 rollout on checkout-service.",
    evidence: "Error rate: 0.145 | P95 Latency: 480ms | Sampling: 1000ms",
  },
  {
    step: "02",
    title: "Historical Context RAG",
    actor: "Incident Memory Agent",
    icon: Database,
    badge: "SIMILARITY: 0.94",
    badgeVariant: "brutalist" as const,
    summary: "Queried Firestore vector index with text-embedding-004. Retrieved 3 analogous prior incidents on database connection timeouts.",
    evidence: "Top match: inc-checkout-dep-9942 (0.942) → Resolution: Rollback to v2.3.9",
  },
  {
    step: "03",
    title: "Gemini 2.5 Flash Synthesis",
    actor: "Decision Agent",
    icon: Brain,
    badge: "CONFIDENCE: 92%",
    badgeVariant: "brutalist" as const,
    summary: "Model Armor screened inputs for prompt injection. Gemini synthesized telemetry deltas and historical patterns, recommending rollback.",
    evidence: "Decision: Rollback | Confidence: 0.92 | Prompt injection scan: CLEAN",
  },
  {
    step: "04",
    title: "Deterministic Policy Gate",
    actor: "Safety Policy Engine",
    icon: ShieldCheck,
    badge: "5/5 RULES PASSED",
    badgeVariant: "success" as const,
    summary: "Deterministic non-LLM safety engine evaluated 5 strict operational rules before granting execution permission.",
    evidence: "No concurrent rollbacks (PASS) · IAM verified (PASS) · Stable target v2.3.9 (PASS)",
  },
  {
    step: "05",
    title: "Gateway Authorization",
    actor: "Two-Tier Agent Gateway",
    icon: Lock,
    badge: "IAM AUTHORIZED",
    badgeVariant: "success" as const,
    summary: "Verified caller identity (decision-agent-sa@gcp). Authorized single-use token for Cloud Deploy rollback execution.",
    evidence: "Authorized tool: clouddeploy.rollback on service: checkout-service",
  },
  {
    step: "06",
    title: "Autonomous Rollback & Postmortem",
    actor: "Rollback & Postmortem Agents",
    icon: RotateCcw,
    badge: "RECOVERED IN 38.4S",
    badgeVariant: "success" as const,
    summary: "Executed Cloud Deploy rollout to stable release v2.3.9. Telemetry verified recovery under 40s; SRE postmortem markdown generated.",
    evidence: "MTTR: 38.4s | Status: RECOVERED | Postmortem: pm-checkout-service-dep-9942.md",
  },
];

export function GovernanceTraceWalkthrough() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = TRACE_STEPS[activeStepIndex];
  const Icon = activeStep.icon;

  return (
    <section id="governance" className="py-16 px-4 lg:px-6 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="space-y-2 max-w-[65ch]">
          <h2 className="text-2xl sm:text-4xl font-mono font-bold uppercase tracking-tight text-foreground">
            Six-Stage Governance Decision Trace
          </h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            Every autonomous rollback is fully inspectable, deterministic, and correlated with OpenTelemetry distributed trace spans.
          </p>
        </div>

        {/* 6-Step Horizontal Progress Ribbon with Dots & Lines */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {TRACE_STEPS.map((s, idx) => {
            const isCurrent = idx === activeStepIndex;
            const isPassed = idx < activeStepIndex;

            return (
              <button
                key={s.step}
                onClick={() => setActiveStepIndex(idx)}
                className={`p-3 border text-left flex flex-col justify-between space-y-2 transition-all ${
                  isCurrent
                    ? "border-foreground bg-foreground text-background shadow-md"
                    : "border-border bg-card hover:border-foreground text-foreground"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold">STAGE {s.step}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCurrent
                        ? "bg-background"
                        : isPassed
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
                <div className="font-mono text-xs font-bold uppercase truncate leading-tight">
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Card without wrapping icon box */}
        <Card className="p-6 border-2 border-border bg-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6 text-foreground shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-muted-foreground">STAGE {activeStep.step}:</span>
                  <h3 className="font-mono font-bold text-base uppercase text-foreground">
                    {activeStep.title}
                  </h3>
                  <Badge variant={activeStep.badgeVariant} className="text-[10px]">
                    {activeStep.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Actor: <strong className="text-foreground">{activeStep.actor}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                className="h-8 text-xs font-mono border-border hover:border-foreground"
              >
                Previous
              </Button>
              <Button
                variant="brutalistPrimary"
                size="sm"
                disabled={activeStepIndex === TRACE_STEPS.length - 1}
                onClick={() => setActiveStepIndex((prev) => Math.min(TRACE_STEPS.length - 1, prev + 1))}
                className="h-8 text-xs font-mono gap-1"
              >
                <span>Next Stage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-muted-foreground">
                EXECUTION SUMMARY
              </h4>
              <p className="text-sm text-foreground font-sans leading-relaxed">
                {activeStep.summary}
              </p>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-muted-foreground">
                EVIDENCE LOG
              </h4>
              <div className="p-3 border border-border bg-muted/20 font-mono text-xs text-foreground leading-relaxed">
                {activeStep.evidence}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
