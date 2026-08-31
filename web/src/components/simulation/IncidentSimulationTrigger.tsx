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
    <Card className="p-3.5 border-2 border-border bg-card space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-foreground shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs uppercase text-foreground">
                Autonomous Rollback Simulation Trigger
              </span>
              <Badge variant="brutalist" className="text-[9px] px-1 py-0">
                INTERACTIVE SRE TEST
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans">
              Inject a simulated post-deployment anomaly to test the autonomous multi-agent governance pipeline.
            </p>
          </div>
        </div>

        <Button
          variant="brutalistPrimary"
          size="sm"
          disabled={isRunning}
          onClick={handleSimulate}
          className="h-8 px-3 text-xs font-mono font-bold uppercase gap-1.5 shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Trigger Anomaly Rollback</span>
            </>
          )}
        </Button>
      </div>

      {simStep && (
        <div className="p-2 border border-border bg-muted/40 font-mono text-[11px] text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>{simStep}</span>
        </div>
      )}
    </Card>
  );
}
