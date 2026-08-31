"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Activity,
  Zap,
  Play,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function HeroSection() {
  const [simState, setSimState] = useState<"nominal" | "spike" | "analyzing" | "policy" | "rollback" | "recovered">("nominal");
  const [timer, setTimer] = useState(0);

  const runSimulation = () => {
    setSimState("spike");
    setTimer(0);
  };

  useEffect(() => {
    if (simState === "nominal" || simState === "recovered") return;

    const interval = setInterval(() => {
      setTimer((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    const t1 = setTimeout(() => setSimState("analyzing"), 900);
    const t2 = setTimeout(() => setSimState("policy"), 1900);
    const t3 = setTimeout(() => setSimState("rollback"), 2900);
    const t4 = setTimeout(() => {
      setSimState("recovered");
    }, 4200);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [simState]);

  const steps = [
    {
      key: "spike",
      num: "01",
      name: "DETECT",
      label: simState === "spike" ? "Spike 14.5x" : "Nominal (0.010)",
      isCurrent: simState === "spike",
      isPassed: ["analyzing", "policy", "rollback", "recovered"].includes(simState),
    },
    {
      key: "analyzing",
      num: "02",
      name: "MEMORY",
      label: simState === "analyzing" ? "Cosine match: 0.94" : "Vector index ready",
      isCurrent: simState === "analyzing",
      isPassed: ["policy", "rollback", "recovered"].includes(simState),
    },
    {
      key: "policy",
      num: "03",
      name: "POLICY",
      label: simState === "policy" ? "5/5 rules passed" : "Deterministic gates",
      isCurrent: simState === "policy",
      isPassed: ["rollback", "recovered"].includes(simState),
    },
    {
      key: "rollback",
      num: "04",
      name: "ROLLBACK",
      label: simState === "rollback" ? "Targeting v2.3.9" : "Cloud Deploy armed",
      isCurrent: simState === "rollback",
      isPassed: ["recovered"].includes(simState),
    },
    {
      key: "recovered",
      num: "05",
      name: "SRE DOC",
      label: simState === "recovered" ? "Report synthesized" : "Markdown export",
      isCurrent: simState === "recovered",
      isPassed: false,
    },
  ];

  return (
    <section className="relative pt-12 pb-16 px-4 lg:px-6 border-b border-border bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Hero Copy */}
        <div className="lg:col-span-6 space-y-5">
          {/* Element 1: Eyebrow */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-border bg-muted/40 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
            <ShieldCheck className="w-4 h-4 text-foreground" />
            <span>Autonomous Release Governance</span>
          </div>

          {/* Element 2: Headline */}
          <h1 className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-foreground uppercase leading-[1.08]">
            Autonomous Safe-Deployment Fleet for Cloud Run & GKE
          </h1>

          {/* Element 3: Subtext */}
          <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed max-w-[55ch]">
            Detect metric spikes in seconds. Enforce deterministic policy gates. Roll back broken releases before users notice.
          </p>

          {/* Element 4: CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="brutalistPrimary"
              size="lg"
              asChild
              className="h-10 px-5 text-xs font-mono font-bold uppercase gap-2"
            >
              <Link href="/dashboard">
                <span>Launch Live Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={runSimulation}
              className="h-10 px-4 text-xs font-mono font-bold uppercase gap-2 border-border hover:border-foreground"
            >
              <Play className="w-3.5 h-3.5 text-foreground" />
              <span>Simulate Incident Rollback</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Interactive Fleet Pipeline Simulation Card */}
        <div className="lg:col-span-6">
          <Card className="border-2 border-border bg-card p-5 space-y-4 shadow-xl">
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-foreground" />
                <span className="font-mono font-bold text-xs uppercase tracking-tight text-foreground">
                  FLEET ORCHESTRATION PIPELINE
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-muted-foreground">MTTR:</span>
                <span className="font-bold text-foreground bg-muted/60 px-2 py-0.5 border border-border">
                  {simState === "nominal" ? "38.4s" : `${(38.4 + timer).toFixed(1)}s`}
                </span>
              </div>
            </div>

            {/* Main Simulation Body: Vertical Left Progress Bar + Right Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Left Column: Vertical Dot & Line Progress Steps */}
              <div className="sm:col-span-5 space-y-0 font-mono text-xs relative pl-2">
                {steps.map((step, idx) => {
                  const isLast = idx === steps.length - 1;

                  return (
                    <div key={step.name} className="relative flex items-start gap-2.5 pb-4 last:pb-0">
                      {/* Vertical connecting line */}
                      {!isLast && (
                        <div
                          className={`absolute left-[5px] top-[14px] bottom-0 w-[1.5px] transition-colors ${
                            step.isPassed
                              ? "bg-foreground"
                              : "bg-border"
                          }`}
                        />
                      )}

                      {/* Dot */}
                      <div className="pt-0.5 relative z-10">
                        <div
                          className={`w-3 h-3 rounded-full border transition-all flex items-center justify-center ${
                            step.isCurrent
                              ? "border-foreground bg-foreground shadow-sm scale-110"
                              : step.isPassed
                              ? "border-foreground bg-foreground"
                              : "border-border bg-card"
                          }`}
                        >
                          {step.isPassed && <span className="w-1 h-1 bg-background rounded-full" />}
                        </div>
                      </div>

                      {/* Step Text */}
                      <div className="leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{step.num}.</span>
                          <span
                            className={`font-bold uppercase tracking-tight text-xs ${
                              step.isCurrent
                                ? "text-foreground underline underline-offset-2"
                                : step.isPassed
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {step.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Live Telemetry Display & Actions */}
              <div className="sm:col-span-7 space-y-3 font-mono">
                <div className="p-3 border border-border bg-muted/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">ACTIVE TARGET:</span>
                    <span className="font-bold text-foreground">checkout-service (v2.4.0)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">HTTP ERROR RATE:</span>
                    <span
                      className={`font-bold ${
                        simState === "spike" || simState === "analyzing"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {simState === "spike" || simState === "analyzing"
                        ? "0.145 (14.5x Spike)"
                        : "0.010 (Nominal)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">GOVERNANCE VERDICT:</span>
                    <span
                      className={`font-bold ${
                        simState === "recovered"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : simState === "rollback"
                          ? "text-foreground underline"
                          : "text-foreground"
                      }`}
                    >
                      {simState === "nominal" && "ARMORED · NOMINAL"}
                      {simState === "spike" && "ANOMALY DETECTED"}
                      {simState === "analyzing" && "MEMORY RAG MATCH"}
                      {simState === "policy" && "POLICY GATES PASSED"}
                      {simState === "rollback" && "EXECUTING ROLLBACK"}
                      {simState === "recovered" && "RECOVERED IN 38.4S"}
                    </span>
                  </div>
                </div>

                {/* Controller Action */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground uppercase">
                    STAGE: {simState}
                  </span>
                  <button
                    onClick={runSimulation}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-colors font-bold uppercase"
                  >
                    <RefreshCw className={`w-3 h-3 ${simState !== "nominal" && simState !== "recovered" ? "animate-spin" : ""}`} />
                    <span>Run Simulation</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
