"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCanonicalTraceStages } from "@/lib/trace-stages";
import { StageDetailHeader } from "@/components/traces/StageDetailHeader";

export function GovernanceTraceWalkthrough() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const steps = getCanonicalTraceStages();
  const activeStep = steps[activeStepIndex] || steps[0];
  const Icon = activeStep.icon;

  return (
    <section id="governance" className="py-16 px-4 lg:px-6 border-b border-border bg-transparent scroll-mt-24 sm:scroll-mt-28">
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
          {steps.map((s, idx) => {
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
          <StageDetailHeader
            activeStep={activeStep}
            activeStepIndex={activeStepIndex}
            totalSteps={steps.length}
            onPrev={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
          />

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
