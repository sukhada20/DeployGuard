"use client";

import React, { useState } from "react";
import { Play, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function IncidentSimulationTrigger() {
  const [isRunning, setIsRunning] = useState(false);
  const [simStep, setSimStep] = useState<string | null>(null);

  const handleSimulate = async () => {
    setIsRunning(true);
    setSimStep("Injecting 14.5x Error Spike on checkout-service...");

    setTimeout(() => {
      setSimStep("Deploy Monitor detected statistical threshold violation (1.25x)...");
    }, 1200);

    setTimeout(() => {
      setSimStep("Incident Memory matched past resolution (Cosine sim: 0.94)...");
    }, 2400);

    setTimeout(() => {
      setSimStep("Decision Agent evaluated Gemini reasoning + 5/5 Policy safety gates passed...");
    }, 3600);

    setTimeout(() => {
      setSimStep("Rollback Agent dispatched Cloud Deploy rollback to stable v2.3.9...");
    }, 4800);

    setTimeout(() => {
      setSimStep("Recovery verified in 38.4s! Postmortem generated.");
      setIsRunning(false);
    }, 6000);
  };

  return (
    <Card className="p-4 sm:p-5 border-2 border-border bg-card/90 backdrop-blur-sm space-y-3 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-foreground shrink-0" />
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <span className="font-mono font-bold text-sm uppercase text-foreground">
                Autonomous Rollback Simulation Trigger
              </span>
              <Badge variant="brutalist" className="text-[10px] px-1.5 py-0.5 font-mono font-bold">
                INTERACTIVE SRE TEST
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              Inject a simulated post-deployment anomaly to test the autonomous multi-agent governance pipeline.
            </p>
          </div>
        </div>

        <Button
          variant="brutalistPrimary"
          size="sm"
          disabled={isRunning}
          onClick={handleSimulate}
          className="h-10 px-5 text-xs sm:text-sm font-mono font-bold uppercase gap-2 shrink-0 shadow-md"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Trigger Anomaly Rollback</span>
            </>
          )}
        </Button>
      </div>

      {simStep && (
        <div className="p-3 border-2 border-border bg-muted/40 font-mono text-xs sm:text-sm text-foreground flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
          <span className="font-semibold">{simStep}</span>
        </div>
      )}
    </Card>
  );
}
