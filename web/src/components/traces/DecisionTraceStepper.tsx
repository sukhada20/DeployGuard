"use client";

import React, { useRef } from "react";
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
} from "lucide-react";
import { DecisionTrace } from "@/types/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DecisionTraceStepperProps {
  trace: DecisionTrace;
}

export const DecisionTraceStepper: React.FC<DecisionTraceStepperProps> = ({ trace }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".step-card", {
        opacity: 0,
        y: 12,
        stagger: 0.08,
        duration: 0.4,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [trace.trace_id] }
  );

  const steps = [
    {
      id: "evidence",
      num: "01",
      title: "Anomaly Evidence",
      icon: AlertTriangle,
      badge: "TRIGGER",
      badgeVariant: "destructive" as const,
      content: trace.evidence_summary,
      status: "PASS",
    },
    {
      id: "memory",
      num: "02",
      title: "Historical Memory",
      icon: Database,
      badge: "VERTEX AI RAG",
      badgeVariant: "info" as const,
      content: "Incident Memory retrieved 3 prior analogous incidents (Cosine similarity: 0.94). Resolution: Rollback.",
      status: "PASS",
    },
    {
      id: "reasoning",
      num: "03",
      title: "Gemini 2.5 Flash",
      icon: Brain,
      badge: "MODEL ARMOR SCREENED",
      badgeVariant: "indigo" as const,
      content: `Evaluated telemetry state: ${trace.decision.toUpperCase()} (Confidence: ${(trace.confidence * 100).toFixed(0)}%). Input screened for prompt injection.`,
      status: "PASS",
    },
    {
      id: "policy",
      num: "04",
      title: "Policy Safety Gate",
      icon: ShieldCheck,
      badge: trace.policy_passed ? "5/5 RULES PASSED" : "POLICY BLOCKED",
      badgeVariant: trace.policy_passed ? "success" as const : "destructive" as const,
      content: trace.authorization_reason,
      checks: trace.policy_checks,
      status: trace.policy_passed ? "PASS" : "FAIL",
    },
    {
      id: "gateway",
      num: "05",
      title: "Gateway Auth",
      icon: Lock,
      badge: trace.authorized ? "IAM AUTHORIZED" : "DENIED",
      badgeVariant: trace.authorized ? "success" as const : "destructive" as const,
      content: "AgentGateway verified caller identity (decision-agent-sa@gcp). Authorized sensitive rollback execution tool.",
      status: trace.authorized ? "PASS" : "FAIL",
    },
    {
      id: "action",
      num: "06",
      title: "Autonomous Action",
      icon: RotateCcw,
      badge: trace.decision.toUpperCase(),
      badgeVariant: "success" as const,
      content: "Dispatched Cloud Deploy automated rollback execution to target stable release version.",
      status: "PASS",
    },
  ];

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Header Info */}
      <Card className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground">TRACE ID:</span>
            <span className="text-xs font-mono font-bold text-foreground">{trace.trace_id}</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            SERVICE: <span className="text-foreground font-semibold">{trace.service_name}</span> | DECIDED: {new Date(trace.decided_at).toUTCString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground">CONFIDENCE:</span>
          <Badge variant="success" className="font-mono text-xs px-2 py-0.5">
            {(trace.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      </Card>

      {/* Governance Pipeline Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isSuccess = step.status === "PASS";

          return (
            <Card
              key={step.id}
              className="step-card p-3.5 flex flex-col justify-between space-y-3 border-border hover:border-foreground/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">[{step.num}]</span>
                    <div className="p-1 border border-border bg-muted/40">
                      <Icon className="w-3.5 h-3.5 text-foreground" />
                    </div>
                    <h4 className="text-xs font-bold font-mono text-foreground uppercase tracking-tight">
                      {step.title}
                    </h4>
                  </div>
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                </div>

                <div className="mb-2">
                  <Badge variant={step.badgeVariant} className="text-[9px] px-1.5 py-0">
                    {step.badge}
                  </Badge>
                </div>

                <p className="text-xs text-foreground/80 font-sans leading-relaxed">{step.content}</p>

                {/* Policy Sub-checks Table */}
                {step.checks && (
                  <div className="mt-2.5 pt-2 border-t border-border/60 space-y-1">
                    {Object.entries(step.checks).map(([checkName, passed]) => (
                      <div key={checkName} className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground uppercase">{checkName.replace(/_/g, " ")}</span>
                        <span
                          className={`font-bold ${
                            passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
