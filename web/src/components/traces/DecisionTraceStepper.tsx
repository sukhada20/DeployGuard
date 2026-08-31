"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Activity,
} from "lucide-react";
import { DecisionTrace } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCanonicalTraceStages } from "@/lib/trace-stages";
import { StageDetailHeader } from "./StageDetailHeader";

interface DecisionTraceStepperProps {
  trace: DecisionTrace;
}

export const DecisionTraceStepper: React.FC<DecisionTraceStepperProps> = ({ trace }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const steps = getCanonicalTraceStages(trace);
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
            <StageDetailHeader
              activeStep={activeStep}
              activeStepIndex={activeStepIndex}
              totalSteps={steps.length}
              onPrev={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
            />

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
