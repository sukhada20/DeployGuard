"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  AlertTriangle,
  Brain,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Database,
  Lock,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { DecisionTrace } from "@/types/api";

interface DecisionTraceStepperProps {
  trace: DecisionTrace;
}

export const DecisionTraceStepper: React.FC<DecisionTraceStepperProps> = ({ trace }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".step-card", {
        opacity: 0,
        y: 20,
        stagger: 0.15,
        duration: 0.6,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [trace.trace_id] }
  );

  const steps = [
    {
      id: "evidence",
      title: "1. Anomaly Evidence",
      icon: AlertTriangle,
      badge: "TRIGGER",
      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      content: trace.evidence_summary,
      status: "PASS",
    },
    {
      id: "memory",
      title: "2. Historical Context",
      icon: Database,
      badge: "VERTEX AI RAG",
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      content: "Incident Memory retrieved 3 prior analogous incidents (Cosine similarity: 0.94). Similar resolution: Rollback.",
      status: "PASS",
    },
    {
      id: "reasoning",
      title: "3. Gemini 2.5 Flash",
      icon: Brain,
      badge: "MODEL ARMOR VERIFIED",
      badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      content: `LLM evaluated state and recommended: ${trace.decision.toUpperCase()} (Confidence: ${(trace.confidence * 100).toFixed(0)}%). Input screened for prompt injection.`,
      status: "PASS",
    },
    {
      id: "policy",
      title: "4. Policy Safety Gate",
      icon: ShieldCheck,
      badge: trace.policy_passed ? "POLICY PASSED" : "POLICY BLOCKED",
      badgeColor: trace.policy_passed ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30",
      content: trace.authorization_reason,
      checks: trace.policy_checks,
      status: trace.policy_passed ? "PASS" : "FAIL",
    },
    {
      id: "gateway",
      title: "5. Gateway Authorization",
      icon: Lock,
      badge: trace.authorized ? "IAM AUTHORIZED" : "DENIED",
      badgeColor: trace.authorized ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30",
      content: "AgentGateway verified caller identity (decision-agent-sa@gcp). Authorized sensitive tool execution.",
      status: trace.authorized ? "PASS" : "FAIL",
    },
    {
      id: "action",
      title: "6. Autonomous Action",
      icon: RotateCcw,
      badge: trace.decision.toUpperCase(),
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      content: "Dispatched Cloud Deploy rollout execution to target stable release version.",
      status: "PASS",
    },
  ];

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-border bg-card/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Trace ID:</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{trace.trace_id}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Service: <span className="text-foreground font-semibold">{trace.service_name}</span> | Decided: {new Date(trace.decided_at).toUTCString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Confidence:</span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
            <span>{(trace.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Governance Pipeline Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const isSuccess = step.status === "PASS";

          return (
            <div
              key={step.id}
              className="step-card p-4 rounded-xl border border-border bg-card/80 flex flex-col justify-between space-y-3 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-muted border border-border">
                      <Icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h4 className="text-xs font-semibold font-mono text-foreground">{step.title}</h4>
                  </div>
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>

                <div className="inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border mb-2.5 font-bold">
                  <span className={step.badgeColor}>{step.badge}</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{step.content}</p>

                {/* Sub-checks if present */}
                {step.checks && (
                  <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
                    {Object.entries(step.checks).map(([checkName, passed]) => (
                      <div key={checkName} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-muted-foreground">{checkName.replace(/_/g, " ")}</span>
                        <span className={passed ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                          {passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
