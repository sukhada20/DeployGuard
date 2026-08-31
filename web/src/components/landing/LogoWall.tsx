"use client";

import React from "react";
import {
  Cloud,
  Layers,
  Zap,
  Rocket,
  Activity,
  Cpu,
  Flame,
  Terminal,
} from "lucide-react";

export function LogoWall() {
  const logos = [
    { name: "Google Cloud", short: "GCP", icon: Cloud },
    { name: "Kubernetes", short: "K8S", icon: Layers },
    { name: "Cloud Run", short: "RUN", icon: Zap },
    { name: "Cloud Deploy", short: "DEPLOY", icon: Rocket },
    { name: "OpenTelemetry", short: "OTEL", icon: Activity },
    { name: "Vertex AI", short: "VERTEX", icon: Cpu },
    { name: "Prometheus", short: "PROM", icon: Flame },
    { name: "FastAPI", short: "FASTAPI", icon: Terminal },
  ];

  return (
    <div className="border-b border-border bg-muted/20 py-6 px-4 lg:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground shrink-0">
          Native Cloud Platform Connectors:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 w-full md:w-auto">
          {logos.map((logo) => {
            const Icon = logo.icon;
            return (
              <div
                key={logo.name}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-border bg-card hover:border-foreground transition-colors"
                title={logo.name}
              >
                <Icon className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span className="font-mono text-xs text-foreground font-bold tracking-tight">
                  {logo.short}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
