"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Play,
  ArrowRight,
  Activity,
  RefreshCw,
  Terminal,
  Cpu,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  const [simState, setSimState] = useState<"nominal" | "spike" | "analyzing" | "policy" | "rollback" | "recovered">("nominal");
  const [timer, setTimer] = useState(0);

  const runSimulation = () => {
    if (simState !== "nominal" && simState !== "recovered") return;
    setSimState("spike");
    setTimer(0);

    setTimeout(() => {
      setSimState("analyzing");
    }, 1100);

    setTimeout(() => {
      setSimState("policy");
    }, 2300);

    setTimeout(() => {
      setSimState("rollback");
    }, 3600);

    setTimeout(() => {
      setSimState("recovered");
    }, 5000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simState !== "nominal" && simState !== "recovered") {
      interval = setInterval(() => {
        setTimer((prev) => +(prev + 0.1).toFixed(1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [simState]);

  const steps = [
    {
      key: "spike",
      num: "01",
      name: "DETECT",
      label: simState === "nominal" ? "1000ms Sampling" : "14.5x Error Spike",
      isCurrent: simState === "spike",
      isPassed: ["analyzing", "policy", "rollback", "recovered"].includes(simState),
    },
    {
      key: "analyzing",
      num: "02",
      name: "MEMORY",
      label: simState === "analyzing" ? "Matching Vectors (0.94)" : "Vector RAG Index",
      isCurrent: simState === "analyzing",
      isPassed: ["policy", "rollback", "recovered"].includes(simState),
    },
    {
      key: "policy",
      num: "03",
      name: "POLICY",
      label: simState === "policy" ? "5/5 Code Gates Pass" : "Deterministic Gates",
      isCurrent: simState === "policy",
      isPassed: ["rollback", "recovered"].includes(simState),
    },
    {
      key: "rollback",
      num: "04",
      name: "ROLLBACK",
      label: simState === "rollback" ? "Deploying v2.3.9" : "Cloud Deploy Armed",
      isCurrent: simState === "rollback",
      isPassed: ["recovered"].includes(simState),
    },
    {
      key: "recovered",
      num: "05",
      name: "SRE DOC",
      label: simState === "recovered" ? "Synthesized in 38.4s" : "Markdown Postmortem",
      isCurrent: simState === "recovered",
      isPassed: false,
    },
  ];

  return (
    <section className="relative min-h-[88vh] flex items-center pt-8 pb-16 px-4 lg:px-8 border-b border-border bg-transparent overflow-hidden">
      {/* Hero Ambient Spotlight glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-foreground/[0.04] rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
        {/* Left Column: Monumental Headline & Value Prop */}
        <div className="lg:col-span-6 space-y-6">
          {/* Eyebrow Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-border bg-card/90 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <ShieldCheck className="w-4 h-4 text-foreground" />
            <span>Autonomous Release Governance</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">GCP Production Fleet</span>
          </div>

          {/* Monumental Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-mono font-black tracking-tight text-foreground uppercase leading-[1.04]">
            Autonomous Safe-Deployment Fleet for Cloud Run & GKE
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-foreground/80 font-sans leading-relaxed max-w-[54ch]">
            Detect metric anomalies in sub-seconds. Enforce deterministic 5-rule safety gates. Roll back broken releases in 38.4s before users notice.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
            <div className="p-2.5 border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-bold uppercase text-[11px]">
                <Activity className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>Sub-Second MTTR</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-sans">
                38.4s average autonomous rollback loop.
              </p>
            </div>

            <div className="p-2.5 border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-bold uppercase text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>Zero Hallucination</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-sans">
                Deterministic code policy evaluation.
              </p>
            </div>

            <div className="p-2.5 border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-bold uppercase text-[11px]">
                <Lock className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>Two-Tier IAM</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-sans">
                Isolated Service Accounts & Model Armor.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Button
              variant="brutalistPrimary"
              size="lg"
              asChild
              className="h-12 px-7 text-xs font-mono font-bold uppercase gap-2.5 shadow-xl"
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
              className="h-12 px-6 text-xs font-mono font-bold uppercase gap-2.5 border-2 border-border hover:border-foreground transition-all"
            >
              <Play className="w-4 h-4 text-foreground" />
              <span>Simulate Incident Rollback</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Hero Stage Terminal & Interactive Pipeline Cockpit */}
        <div className="lg:col-span-6">
          <Card className="border-2 border-foreground/30 p-6 space-y-5 shadow-2xl bg-card/90 backdrop-blur-md">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-foreground" />
                <span className="font-mono font-bold text-xs uppercase tracking-tight text-foreground">
                  FLEET ORCHESTRATION PIPELINE
                </span>
                <Badge variant="brutalist" className="text-[9px] px-1 py-0">
                  LIVE RECOVERY ENGINE
                </Badge>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-muted-foreground">MTTR:</span>
                <span className="font-bold text-foreground bg-muted/60 px-2 py-0.5 border border-border">
                  {simState === "nominal" ? "38.4s" : `${(38.4 + timer).toFixed(1)}s`}
                </span>
              </div>
            </div>

            {/* Main Stage Grid: Left Vertical Progress Stepper + Right Telemetry Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
              {/* Left Column: Vertical Dot & Line Progress Bar */}
              <div className="sm:col-span-5 space-y-0 font-mono text-xs relative pl-1">
                {steps.map((step, idx) => {
                  const isLast = idx === steps.length - 1;

                  return (
                    <div key={step.name} className="relative flex items-start gap-2.5 pb-4 last:pb-0">
                      {/* Vertical line connecting dots */}
                      {!isLast && (
                        <div
                          className={`absolute left-[5px] top-[14px] bottom-0 w-[1.5px] transition-colors duration-300 ${
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
                              ? "border-foreground bg-foreground shadow-sm scale-125"
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
                                ? "text-foreground underline underline-offset-2 font-black"
                                : step.isPassed
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-sans">
                          {step.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Real-Time Telemetry Readout & Trigger */}
              <div className="sm:col-span-7 space-y-3.5 font-mono">
                <div className="p-3.5 border border-border bg-muted/20 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">ACTIVE TARGET:</span>
                    <span className="font-bold text-foreground">checkout-service (v2.4.0)</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">HTTP ERROR RATE:</span>
                    <span
                      className={`font-bold ${
                        simState === "spike" || simState === "analyzing"
                          ? "text-rose-600 dark:text-rose-400 font-black"
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

                {/* Controller Action Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground uppercase font-mono">
                    STAGE: <strong className="text-foreground">{simState}</strong>
                  </span>

                  <Button
                    size="sm"
                    variant="brutalistPrimary"
                    disabled={simState !== "nominal" && simState !== "recovered"}
                    onClick={runSimulation}
                    className="h-8 px-3 text-xs font-mono font-bold uppercase gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${simState !== "nominal" && simState !== "recovered" ? "animate-spin" : ""}`} />
                    <span>Run Simulation</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
