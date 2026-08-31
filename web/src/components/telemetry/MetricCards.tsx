"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Gauge } from "lucide-react";
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
      className={`p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-colors border-2 ${
        detail.is_anomaly
          ? "border-rose-500 bg-rose-500/[0.05] dark:border-rose-500 dark:bg-rose-950/20"
          : "border-border hover:border-foreground/60 bg-card/90 backdrop-blur-sm"
      }`}
    >
      {/* Top row: Name & Alert Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-mono font-bold text-muted-foreground uppercase tracking-tight truncate">
          {detail.name}
        </span>
        {detail.is_anomaly ? (
          <Badge variant="destructive" className="h-5 px-2 text-[10px] font-mono font-bold">
            <AlertTriangle className="w-3 h-3 mr-1" />
            SPIKE
          </Badge>
        ) : (
          <Badge variant="success" className="h-5 px-2 text-[10px] font-mono font-bold">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            NOMINAL
          </Badge>
        )}
      </div>

      {/* Main value & Delta */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-black font-mono text-foreground tracking-tight">
          <span ref={numRef}>{detail.current}</span>
          <span className="text-sm font-normal text-muted-foreground ml-1">{detail.unit}</span>
        </div>
        <div
          className={`flex items-center gap-1 text-xs sm:text-sm font-mono font-bold ${
            detail.is_anomaly
              ? "text-rose-600 dark:text-rose-400"
              : detail.delta_pct === 0
              ? "text-muted-foreground"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{detail.delta_pct > 0 ? `+${detail.delta_pct}%` : `${detail.delta_pct}%`}</span>
        </div>
      </div>

      {/* Baseline Reference */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>BASELINE: <strong className="text-foreground">{detail.baseline} {detail.unit}</strong></span>
      </div>

      {/* Sparkline Graph */}
      <div className="pt-1">
        <SparklineChart data={detail.history || [detail.baseline, detail.current]} isAnomaly={detail.is_anomaly} />
      </div>
    </Card>
  );
};

export const MetricCards: React.FC<MetricCardsProps> = ({ telemetry }) => {
  if (!telemetry?.metrics) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono text-xs border-2 border-dashed border-border bg-card/60">
        [INITIALIZING TELEMETRY STREAMS: SAMPLING 1000MS]
      </div>
    );
  }

  const metrics = telemetry.metrics;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono">
          <Gauge className="w-4 h-4 text-foreground" />
          7-Dimension Telemetry Matrix
        </h2>
        <span className="text-xs text-muted-foreground font-mono">SAMPLING: 1000MS · BASELINE COMPARISON</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
