"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Zap } from "lucide-react";
import anime from "animejs";
import { TelemetryMetrics, MetricDetail } from "@/types/api";
import { SparklineChart } from "./SparklineChart";

interface MetricCardsProps {
  telemetry?: TelemetryMetrics;
}

const MetricCardItem: React.FC<{ metricKey: string; detail: MetricDetail }> = ({ metricKey, detail }) => {
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (numRef.current) {
      anime({
        targets: numRef.current,
        innerHTML: [0, detail.current],
        round: detail.unit === "%" || detail.unit === "req/s" ? 100 : 1,
        easing: "easeOutExpo",
        duration: 900,
      });
    }
  }, [detail.current, detail.unit]);

  const isUp = detail.delta_pct > 0;

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 bg-card/60 relative overflow-hidden ${
      detail.is_anomaly
        ? "border-rose-500/50 bg-rose-950/10 glow-rose"
        : "border-border hover:border-border/80 hover:bg-card/80"
    }`}>
      {/* Top row: Name & Alert Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground">{detail.name}</span>
        {detail.is_anomaly ? (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-2.5 h-2.5" />
            Spike
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Nominal
          </span>
        )}
      </div>

      {/* Main value & Delta */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
          <span ref={numRef}>{detail.current}</span>
          <span className="text-xs text-muted-foreground ml-1">{detail.unit}</span>
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-mono font-medium ${
          detail.is_anomaly
            ? "text-rose-400"
            : detail.delta_pct === 0
            ? "text-muted-foreground"
            : "text-emerald-400"
        }`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{detail.delta_pct > 0 ? `+${detail.delta_pct}%` : `${detail.delta_pct}%`}</span>
        </div>
      </div>

      {/* Baseline Reference */}
      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground/80 mb-2">
        <span>Baseline: {detail.baseline} {detail.unit}</span>
      </div>

      {/* Sparkline Graph */}
      <SparklineChart data={detail.history || [detail.baseline, detail.current]} isAnomaly={detail.is_anomaly} />
    </div>
  );
};

export const MetricCards: React.FC<MetricCardsProps> = ({ telemetry }) => {
  if (!telemetry?.metrics) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
        Loading telemetry metrics...
      </div>
    );
  }

  const metrics = telemetry.metrics;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono">
          <Zap className="w-4 h-4 text-cyan-400" />
          7-Dimension Telemetry & Baseline Comparison
        </h2>
        <span className="text-xs text-muted-foreground font-mono">Sampling: 1000ms</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCardItem metricKey="error_rate" detail={metrics.error_rate} />
        <MetricCardItem metricKey="latency_p95" detail={metrics.latency_p95} />
        <MetricCardItem metricKey="cpu_utilization" detail={metrics.cpu_utilization} />
        <MetricCardItem metricKey="memory_utilization" detail={metrics.memory_utilization} />
        <MetricCardItem metricKey="crash_count" detail={metrics.crash_count} />
        <MetricCardItem metricKey="restart_count" detail={metrics.restart_count} />
        <MetricCardItem metricKey="request_rate" detail={metrics.request_rate} />
      </div>
    </div>
  );
};
