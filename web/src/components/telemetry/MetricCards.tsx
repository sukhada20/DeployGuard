"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Zap, Gauge } from "lucide-react";
import anime from "animejs";
import { TelemetryMetrics, MetricDetail } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SparklineChart } from "./SparklineChart";

interface MetricCardsProps {
  telemetry?: TelemetryMetrics;
}

const MetricCardItem: React.FC<{ detail: MetricDetail }> = ({ detail }) => {
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (numRef.current) {
      anime({
        targets: numRef.current,
        innerHTML: [0, detail.current],
        round: detail.unit === "%" || detail.unit === "req/s" ? 100 : 1,
        easing: "easeOutExpo",
        duration: 800,
      });
    }
  }, [detail.current, detail.unit]);

  const isUp = detail.delta_pct > 0;

  return (
    <Card
      className={`p-3.5 flex flex-col justify-between transition-colors ${
        detail.is_anomaly
          ? "border-rose-500/80 bg-rose-500/[0.04] dark:border-rose-500/80 dark:bg-rose-950/20"
          : "border-border hover:border-foreground/40 bg-card"
      }`}
    >
      {/* Top row: Name & Alert Badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-tight truncate">
          {detail.name}
        </span>
        {detail.is_anomaly ? (
          <Badge variant="destructive" className="h-5 px-1.5 text-[9px]">
            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
            SPIKE
          </Badge>
        ) : (
          <Badge variant="success" className="h-5 px-1.5 text-[9px]">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
            NOMINAL
          </Badge>
        )}
      </div>

      {/* Main value & Delta */}
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
          <span ref={numRef}>{detail.current}</span>
          <span className="text-xs font-normal text-muted-foreground ml-1">{detail.unit}</span>
        </div>
        <div
          className={`flex items-center gap-0.5 text-xs font-mono font-bold ${
            detail.is_anomaly
              ? "text-rose-600 dark:text-rose-400"
              : detail.delta_pct === 0
              ? "text-muted-foreground"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{detail.delta_pct > 0 ? `+${detail.delta_pct}%` : `${detail.delta_pct}%`}</span>
        </div>
      </div>

      {/* Baseline Reference */}
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
        <span>BASELINE: {detail.baseline} {detail.unit}</span>
      </div>

      {/* Sparkline Graph */}
      <SparklineChart data={detail.history || [detail.baseline, detail.current]} isAnomaly={detail.is_anomaly} />
    </Card>
  );
};

export const MetricCards: React.FC<MetricCardsProps> = ({ telemetry }) => {
  if (!telemetry?.metrics) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono text-xs border border-dashed border-border">
        [INITIALIZING TELEMETRY STREAMS: SAMPLING 1000MS]
      </div>
    );
  }

  const metrics = telemetry.metrics;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-mono">
          <Gauge className="w-3.5 h-3.5 text-foreground" />
          7-Dimension Telemetry Matrix
        </h2>
        <span className="text-[10px] text-muted-foreground font-mono">SAMPLING: 1000MS · BASELINE COMPARISON</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCardItem detail={metrics.error_rate} />
        <MetricCardItem detail={metrics.latency_p95} />
        <MetricCardItem detail={metrics.cpu_utilization} />
        <MetricCardItem detail={metrics.memory_utilization} />
        <MetricCardItem detail={metrics.crash_count} />
        <MetricCardItem detail={metrics.restart_count} />
        <MetricCardItem detail={metrics.request_rate} />
      </div>
    </div>
  );
};
