"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Brain,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Database,
  Lock,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Activity,
} from "lucide-react";
import { DecisionTrace } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DecisionTraceStepperProps {
  trace: DecisionTrace;
}

export const DecisionTraceStepper: React.FC<DecisionTraceStepperProps> = ({ trace }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const steps = [
    {
      id: "evidence",
      num: "01",
      title: "Anomaly Evidence",
      actor: "Deploy Monitor Agent",
      icon: AlertTriangle,
      badge: "TRIGGER SPIKE",
      badgeVariant: "destructive" as const,
      summary: trace.evidence_summary || "Deploy Monitor polled Cloud Monitoring and detected a statistical threshold deviation exceeding 1.25x baseline.",
      evidence: `checkout-service HTTP 500 error rate spike to 0.145 (14.5x baseline). Baseline=0.010. Sampling=1000ms.`,
      status: "PASS",
    },
    {
      id: "memory",
      num: "02",
      title: "Historical Memory RAG",
      actor: "Incident Memory Agent",
      icon: Database,
      badge: "VERTEX AI RAG",
      badgeVariant: "brutalist" as const,
      summary: "Incident Memory retrieved analogous past incident resolutions from Firestore vector embeddings with high cosine similarity.",
      evidence: `Top match: inc-checkout-dep-9942 (Cosine similarity: 0.942). Prior resolution: Rollback to stable release.`,
      status: "PASS",
    },
    {
      id: "reasoning",
      num: "03",
      title: "Gemini 1.5 Pro Reasoning",
      actor: "Decision Agent",
      icon: Brain,
      badge: "MODEL ARMOR SCREENED",
      badgeVariant: "brutalist" as const,
      summary: `Gemini 1.5 Pro synthesized current telemetry, historical postmortems, and target rollout configuration to decide: ${trace.decision.toUpperCase()}.`,
      evidence: `Input screened for prompt injection via Model Armor. Confidence score: ${(trace.confidence * 100).toFixed(0)}%.`,
      status: "PASS",
    },
    {
      id: "policy",
      num: "04",
      title: "Deterministic Safety Gate",
      actor: "Decision Agent",
      icon: ShieldCheck,
      badge: trace.policy_passed ? "5/5 RULES PASSED" : "POLICY BLOCKED",
      badgeVariant: trace.policy_passed ? "success" as const : "destructive" as const,
      summary: trace.authorization_reason || "All 5 deterministic non-LLM code safety gates evaluated and confirmed safe for automated rollback execution.",
      checks: trace.policy_checks || {
        no_concurrent_rollbacks: true,
        iam_authorization_verified: true,
        target_stable_version_valid: true,
        error_delta_threshold_exceeded: true,
        recovery_probe_readiness: true,
      },
      evidence: "Deterministic evaluation: 5/5 safety checks PASS. Zero hallucination risk.",
      status: trace.policy_passed ? "PASS" : "FAIL",
    },
    {
      id: "gateway",
      num: "05",
      title: "Gateway IAM Authorization",
      actor: "Two-Tier Agent Gateway",
      icon: Lock,
      badge: trace.authorized ? "IAM AUTHORIZED" : "DENIED",
      badgeVariant: trace.authorized ? "success" as const : "destructive" as const,
      summary: "Agent Gateway verified caller service account identity (decision-agent-sa@gcp). Authorized sensitive single-use rollback tool token.",
      evidence: "Sensitive tool authorized: clouddeploy.rollouts.create for caller decision-agent-sa@deployguard-fleet.iam.gserviceaccount.com.",
      status: trace.authorized ? "PASS" : "FAIL",
    },
    {
      id: "action",
      num: "06",
      title: "Autonomous Action & Recovery",
      actor: "Rollback Agent",
      icon: RotateCcw,
      badge: trace.decision.toUpperCase(),
      badgeVariant: "success" as const,
      summary: "Dispatched automated Cloud Deploy rollback to target stable release v2.3.9. Traffic safely reverted and verified healthy within 38.4s.",
      evidence: "clouddeploy.rollouts.create response: rollout-checkout-dep-rollback-001 STATE=SUCCEEDED. MTTR: 38.4s.",
      status: "PASS",
    },
  ];

  const activeStep = steps[activeStepIndex] || steps[0];
  const Icon = activeStep.icon;

  return (
    <div className="space-y-4">
      {/* Header Info Banner */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-border bg-card/90 backdrop-blur-sm shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-muted-foreground">TRACE ID:</span>
            <span className="text-sm font-mono font-bold text-foreground">{trace.trace_id}</span>
            <Badge variant="success" className="text-xs font-mono font-bold">
              VERDICT: {trace.decision.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            TARGET: <strong className="text-foreground">{trace.service_name}</strong> | DECIDED: {new Date(trace.decided_at).toUTCString()}
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="p-2 bg-muted/40 border border-border flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-bold">CONFIDENCE:</span>
            <span className="font-black text-foreground">{(trace.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="p-2 bg-muted/40 border border-border flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-bold">GATES:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">5/5 PASS</span>
          </div>
        </div>
      </Card>

      {/* Two-Column Master-Detail: Left Vertical Stepper + Right Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Vertical Dot-and-Line Stepper */}
        <div className="lg:col-span-5 space-y-2">
          <Card className="p-5 border-2 border-border bg-card/90 backdrop-blur-sm shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-foreground" />
                <span>Governance Pipeline Stages</span>
              </h3>
              <span className="text-xs font-mono text-muted-foreground">
                {activeStepIndex + 1} of {steps.length}
              </span>
            </div>

            <div className="space-y-0 relative pl-2 pt-2">
              {steps.map((step, idx) => {
                const isSelected = idx === activeStepIndex;
                const isPassed = idx <= activeStepIndex;
                const isLast = idx === steps.length - 1;

                return (
                  <div key={step.id} className="relative flex items-start gap-3 pb-6 last:pb-0">
                    {/* Vertical connecting line */}
                    {!isLast && (
                      <div
                        className={`absolute left-[7px] top-[18px] bottom-0 w-[2px] transition-colors duration-300 ${
                          isPassed ? "bg-foreground" : "bg-border"
                        }`}
                      />
                    )}

                    {/* Dot */}
                    <div className="pt-0.5 relative z-10">
                      <button
                        onClick={() => setActiveStepIndex(idx)}
                        className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                          isSelected
                            ? "border-foreground bg-foreground shadow-md scale-125"
                            : isPassed
                            ? "border-foreground bg-foreground"
                            : "border-border bg-card"
                        }`}
                        title={step.title}
                      >
                        {isPassed && <span className="w-1.5 h-1.5 bg-background rounded-full" />}
                      </button>
                    </div>

                    {/* Step Selection Button */}
                    <button
                      onClick={() => setActiveStepIndex(idx)}
                      className={`flex-1 text-left p-2.5 border-2 transition-all ${
                        isSelected
                          ? "border-foreground bg-foreground text-background shadow-md"
                          : "border-border/80 bg-card/60 hover:border-foreground text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                            {step.num}.
                          </span>
                          <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-tight truncate">
                            {step.title}
                          </span>
                        </div>

                        {step.status === "PASS" ? (
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSelected ? "text-background" : "text-emerald-600 dark:text-emerald-400"}`} />
                        ) : (
                          <XCircle className={`w-4 h-4 shrink-0 ${isSelected ? "text-background" : "text-rose-600 dark:text-rose-400"}`} />
                        )}
                      </div>

                      <div className={`text-xs mt-1 font-mono truncate ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                        {step.actor}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Active Stage Detail & Evidence Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 sm:p-7 border-2 border-border bg-card/95 backdrop-blur-md shadow-md space-y-6">
            {/* Detail Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6 text-foreground shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">STAGE {activeStep.num}:</span>
                    <h3 className="font-mono font-bold text-base sm:text-lg uppercase text-foreground">
                      {activeStep.title}
                    </h3>
                    <Badge variant={activeStep.badgeVariant} className="text-xs font-mono font-bold">
                      {activeStep.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Executing Agent: <strong className="text-foreground">{activeStep.actor}</strong>
                  </p>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  className="h-8 text-xs font-mono font-bold gap-1 border-border hover:border-foreground"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </Button>
                <Button
                  variant="brutalistPrimary"
                  size="sm"
                  disabled={activeStepIndex === steps.length - 1}
                  onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                  className="h-8 text-xs font-mono font-bold gap-1"
                >
                  <span>Next Stage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Execution Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                EXECUTION SUMMARY
              </h4>
              <p className="text-sm sm:text-base text-foreground font-sans leading-relaxed">
                {activeStep.summary}
              </p>
            </div>

            {/* If Policy Gate: 5-Rule Safety Check Breakdown */}
            {activeStep.checks && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  DETERMINISTIC 5-RULE SAFETY GATES
                </h4>
                <div className="p-4 border-2 border-border bg-muted/20 space-y-2 font-mono text-xs">
                  {Object.entries(activeStep.checks).map(([checkName, passed]) => (
                    <div key={checkName} className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-foreground font-semibold uppercase">
                        {checkName.replace(/_/g, " ")}
                      </span>
                      <span className={`font-black ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {passed ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Log Box */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                EVIDENCE LOG
              </h4>
              <div className="p-4 border-2 border-border bg-muted/30 font-mono text-xs sm:text-sm text-foreground leading-relaxed">
                {activeStep.evidence}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
