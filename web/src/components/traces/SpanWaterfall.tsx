"use client";

import React from "react";
import { Layers, ExternalLink } from "lucide-react";
import { TraceSpan } from "@/types/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SpanWaterfallProps {
  traceId: string;
  spans?: TraceSpan[];
}

const DEFAULT_SPANS: TraceSpan[] = [
  { name: "deployguard.deployment", duration_ms: 38400, status: "OK", start_offset_ms: 0 },
  { name: "monitor.detect", duration_ms: 1200, status: "OK", start_offset_ms: 200 },
  { name: "decision.evaluate", duration_ms: 1850, status: "OK", start_offset_ms: 1500 },
  { name: "rollback.execute", duration_ms: 14200, status: "OK", start_offset_ms: 3400 },
  { name: "monitor.verify_recovery", duration_ms: 18000, status: "OK", start_offset_ms: 17800 },
  { name: "postmortem.generate", duration_ms: 2100, status: "OK", start_offset_ms: 36000 },
];

export const SpanWaterfall: React.FC<SpanWaterfallProps> = ({ traceId, spans = DEFAULT_SPANS }) => {
  const totalDuration = Math.max(...spans.map((s) => s.start_offset_ms + s.duration_ms), 40000);

  return (
    <Card className="border-border">
      <div className="p-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
            OpenTelemetry Distributed Span Waterfall
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-7 text-[11px] font-mono gap-1 border-border hover:border-foreground"
        >
          <a
            href={`https://console.cloud.google.com/traces/list?project=deployguard-fleet&tid=${traceId}`}
            target="_blank"
            rel="noreferrer"
          >
            <span>Cloud Trace Console</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>
      </div>

      {/* Waterfall Rows */}
      <div className="p-4 space-y-3">
        {spans.map((span, idx) => {
          const leftPercent = (span.start_offset_ms / totalDuration) * 100;
          const widthPercent = Math.max(3, (span.duration_ms / totalDuration) * 100);

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="text-foreground font-bold">{span.name}</span>
                <span>{span.duration_ms}ms</span>
              </div>
              <div className="w-full h-3 bg-muted/40 border border-border/60 overflow-hidden relative">
                <div
                  style={{
                    marginLeft: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  className="h-full bg-foreground border-r border-background"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
