"use client";

import React, { useState } from "react";
import {
  Activity,
  Database,
  BrainCircuit,
  ShieldCheck,
  RotateCcw,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TRACE_STEPS = [
  {
    step: 1,
    actor: "Deploy Monitor",
    icon: Activity,
    title: "Anomaly Ingestion & Delta Computation",
    summary:
      "Deploy Monitor polls Google Cloud Monitoring every 1000ms. An HTTP 500 error rate spike to 0.145 (14.5x baseline) breaches the 1.25x statistical standard deviation threshold.",
    evidence: "time_series.list response: checkout-service error_rate=0.145 (baseline=0.010, ratio=14.5x)",
    badge: "STAGE 1",
    badgeVariant: "destructive" as const,
  },
  {
    step: 2,
    actor: "Incident Memory",
    icon: Database,
    title: "Vertex AI Vector RAG Correlation",
    summary:
      "Incident Memory embeds the error signature using text-embedding-004 and searches Firestore vector store. Finds analogous incident inc-checkout-dep-9942 with 94.2% cosine similarity.",
    evidence: "Vector similarity match: inc-checkout-dep-9942 (score=0.942, cause='DB pool exhaustion')",
    badge: "STAGE 2",
    badgeVariant: "brutalist" as const,
  },
  {
    step: 3,
    actor: "Decision Agent",
    icon: BrainCircuit,
    title: "Gemini 1.5 Pro Reasoning Core",
    summary:
      "Decision Agent constructs a multi-turn reasoning prompt containing telemetry history, rollout spec, and matched past postmortems. Gemini evaluates root cause and recommends rollback to v2.3.9.",
    evidence: "Gemini 1.5 Pro output: 'Rollback recommended to v2.3.9 to restore pool headroom (confidence=0.98)'",
    badge: "STAGE 3",
    badgeVariant: "brutalist" as const,
  },
  {
    step: 4,
    actor: "Decision Agent",
    icon: ShieldCheck,
    title: "Deterministic 5-Rule Safety Policy Evaluation",
    summary:
      "Non-LLM deterministic code gates evaluate the LLM proposal. All 5 safety rules pass: single concurrent rollback, valid stable target v2.3.9, caller token valid, probe configured.",
    evidence: "Policy evaluation: 5/5 rules PASS (no_concurrent_rollbacks, valid_target, iam_auth, delta_threshold, probes)",
    badge: "STAGE 4",
    badgeVariant: "success" as const,
  },
  {
    step: 5,
    actor: "Rollback Agent",
    icon: RotateCcw,
    title: "Cloud Deploy Execution & Traffic Shift",
    summary:
      "Rollback Agent dispatches an automated rollback command to Cloud Deploy via two-tier gateway. Traffic reverts 100% to release v2.3.9 on Cloud Run / GKE within 38.4 seconds.",
    evidence: "clouddeploy.rollouts.create response: rollout-checkout-dep-rollback-001 STATE=SUCCEEDED",
    badge: "STAGE 5",
    badgeVariant: "success" as const,
  },
  {
    step: 6,
    actor: "Postmortem Agent",
    icon: FileText,
    title: "SRE Postmortem Document Synthesis",
    summary:
      "Postmortem Agent synthesizes a complete Markdown report with 5-Whys analysis, telemetry deltas, timeline breakdown, and preventative action items. Persisted to Firestore.",
    evidence: "Firestore document created: /postmortems/pm-checkout-service-dep-9942.md (duration=38.4s)",
    badge: "STAGE 6",
    badgeVariant: "outline" as const,
  },
];

export function GovernanceTraceWalkthrough() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = TRACE_STEPS[activeStepIndex];
  const Icon = activeStep.icon;

  return (
    <section id="governance" className="py-16 px-4 lg:px-6 border-b border-border bg-transparent">
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
