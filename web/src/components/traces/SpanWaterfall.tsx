"use client";

import React from "react";
import { Layers, ExternalLink } from "lucide-react";
import { TraceSpan } from "@/types/api";

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
    <div className="p-4 rounded-xl border border-border bg-card/60 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            OpenTelemetry Distributed Span Waterfall
          </h3>
        </div>
        <a
          href={`https://console.cloud.google.com/traces/list?project=deployguard-fleet&tid=${traceId}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>Cloud Trace Console</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Waterfall Rows */}
      <div className="space-y-2.5 pt-2">
        {spans.map((span, idx) => {
          const leftPercent = (span.start_offset_ms / totalDuration) * 100;
          const widthPercent = Math.max(3, (span.duration_ms / totalDuration) * 100);

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="text-foreground font-semibold">{span.name}</span>
                <span>{span.duration_ms}ms</span>
              </div>
              <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden relative">
                <div
                  style={{
                    marginLeft: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full shadow-sm"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
