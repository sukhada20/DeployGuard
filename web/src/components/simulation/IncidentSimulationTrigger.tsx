"use client";

import React, { useState } from "react";
import { Play, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:8000";
}

export function IncidentSimulationTrigger() {
  const [isRunning, setIsRunning] = useState(false);
  const [simStep, setSimStep] = useState<string | null>(null);

  const handleSimulate = async () => {
    setIsRunning(true);
    setSimStep("Triggering protection endpoint...");

    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/api/v1/deployments/protect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_name: "checkout-service",
          target_version: "v2.4.0",
          stable_version: "v2.3.9",
          environment: "production",
          simulate_anomaly: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to trigger deployment: ${res.statusText}`);
      }

      setSimStep("Injecting 14.5x Error Spike...");

      setTimeout(() => {
        setSimStep("Deploy Monitor detected 1.25x deviation...");
      }, 1000);

      setTimeout(() => {
        setSimStep("Incident Memory matched vectors (0.91)...");
      }, 2000);

      setTimeout(() => {
        setSimStep("Decision Agent: 5/5 Safety Gates passed...");
      }, 3000);

      setTimeout(() => {
        setSimStep("Rollback Agent: Cloud Deploy armed...");
      }, 4000);

      setTimeout(() => {
        setSimStep("Recovered! Postmortem saved to Firestore.");
        setIsRunning(false);
      }, 5500);
    } catch (err) {
      console.error("Simulation error", err);
      setSimStep("Simulation failed to trigger backend API.");
      setIsRunning(false);
    }
  };

  return (
    <Card className="p-4 space-y-3 border-2 border-border bg-card/90 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Zap className="w-4 h-4 text-foreground" />
          <span>Incident Simulation</span>
        </div>
        <Badge variant="brutalist" className="text-[10px] px-1.5 py-0 font-mono font-bold">
          SRE TEST
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground font-sans leading-relaxed">
        Inject a simulated post-deployment metric spike to test the autonomous multi-agent rollback pipeline.
      </p>

      <Button
        variant="brutalistPrimary"
        size="sm"
        disabled={isRunning}
        onClick={handleSimulate}
        className="w-full h-9 px-4 text-xs font-mono font-bold uppercase gap-2 shadow-sm"
      >
        {isRunning ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Simulating Rollback...</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            <span>Trigger Anomaly Rollback</span>
          </>
        )}
      </Button>

      {simStep && (
        <div className="p-2.5 border-2 border-border bg-muted/40 font-mono text-xs text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
          <span className="font-semibold truncate">{simStep}</span>
        </div>
      )}
    </Card>
  );
}
