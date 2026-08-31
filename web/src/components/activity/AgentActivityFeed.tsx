"use client";

import React from "react";
import { Bot, Terminal, Shield, Brain, RotateCcw, FileText } from "lucide-react";
import { AgentEventMessage } from "@/types/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentActivityFeedProps {
  events: AgentEventMessage[];
  onOpenTerminal: () => void;
}

const getAgentIcon = (role?: string) => {
  switch (role) {
    case "monitor":
    case "deploy_monitor_agent":
      return <Shield className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />;
    case "decision":
    case "decision_agent":
      return <Brain className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    case "rollback":
    case "rollback_agent":
      return <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
    case "postmortem":
    case "postmortem_agent":
      return <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Bot className="w-3.5 h-3.5 text-foreground" />;
  }
};

const getRoleBadgeVariant = (role?: string): "info" | "warning" | "destructive" | "success" | "secondary" => {
  switch (role) {
    case "monitor":
    case "deploy_monitor_agent":
      return "info";
    case "decision":
    case "decision_agent":
      return "warning";
    case "rollback":
    case "rollback_agent":
      return "destructive";
    case "postmortem":
    case "postmortem_agent":
      return "success";
    default:
      return "secondary";
  }
};

const DEFAULT_SAMPLE_EVENTS: AgentEventMessage[] = [
  {
    event: "postmortem_ready",
    timestamp: "2026-08-31T13:45:08Z",
    data: {
      role: "postmortem_agent",
      action: "REPORT_SYNTHESIZED",
      message: "Postmortem report pm-checkout-service-dep-9942 generated with Gemini narrative and Firestore storage.",
      thinking: "5-Whys root cause analysis synthesized: DB connection timeouts mitigated via rollback.",
    },
  },
  {
    event: "recovery_event",
    timestamp: "2026-08-31T13:45:06Z",
    data: {
      role: "deploy_monitor_agent",
      action: "RECOVERY_VERIFIED",
      message: "Recovery verification completed: All 7 metrics returned below 1.15x baseline thresholds. Verdict: recovered.",
      thinking: "Error rate dropped to 0.010, latency restored to 120ms across 3 sampling iterations.",
    },
  },
  {
    event: "rollback_event",
    timestamp: "2026-08-31T13:44:48Z",
    data: {
      role: "rollback_agent",
      action: "ROLLOUT_EXECUTED",
      message: "Cloud Deploy rollback executed to stable version v2.3.9. Rollout ID: op-9942.",
      thinking: "Two-tier gateway permission verified and DecisionTrace policy validated.",
    },
  },
  {
    event: "decision_event",
    timestamp: "2026-08-31T13:44:34Z",
    data: {
      role: "decision_agent",
      action: "POLICY_AUTHORIZED",
      message: "Decision: rollback (Confidence 0.92). All 5 deterministic policy safety gates PASSED.",
      thinking: "Vertex AI RAG retrieved 3 similar past incidents; Model Armor verified prompt security.",
    },
  },
  {
    event: "anomaly_alert",
    timestamp: "2026-08-31T13:44:32Z",
    data: {
      role: "deploy_monitor_agent",
      action: "ANOMALY_DETECTED",
      message: "CRITICAL anomaly detected: error_rate spiked 14.5x above baseline, P95 latency jumped to 480ms.",
      thinking: "Statistical delta exceeded CRITICAL threshold (1.25x). Dispatching anomaly signal to state.",
    },
  },
];

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({ events, onOpenTerminal }) => {
  const displayEvents = events.length > 0 ? events : DEFAULT_SAMPLE_EVENTS;

  return (
    <Card className="flex flex-col h-full border-border">
      {/* Header */}
      <div className="p-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-foreground" />
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-foreground">
            Autonomous Fleet Activity Stream
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenTerminal}
          className="h-7 text-[11px] gap-1.5 font-mono border-border hover:border-foreground"
        >
          <Terminal className="w-3 h-3" />
          <span>Raw SSE Terminal</span>
        </Button>
      </div>

      {/* Events List */}
      <div className="p-3 space-y-2.5 overflow-y-auto max-h-[520px]">
        {displayEvents.map((evt, idx) => {
          const role = evt.data?.role || "system";
          const action = evt.data?.action || evt.event;
          const msg = evt.data?.message || JSON.stringify(evt.data);
          const thinking = evt.data?.thinking;
          const time = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : "JUST NOW";

          return (
            <div
              key={idx}
              className="p-3 border border-border bg-card/60 hover:bg-muted/30 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getAgentIcon(role)}
                  <Badge variant={getRoleBadgeVariant(role)} className="text-[9px] px-1.5 py-0">
                    {role}
                  </Badge>
                  <span className="text-[11px] font-mono font-bold text-foreground uppercase tracking-tight">
                    {action}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{time}</span>
              </div>

              <p className="text-xs text-foreground/90 font-sans leading-relaxed">{msg}</p>

              {thinking && (
                <div className="p-2 border-l-2 border-foreground/70 bg-muted/40 text-[11px] font-mono text-foreground/80 flex items-start gap-1.5">
                  <span className="text-muted-foreground font-bold shrink-0">REASONING:</span>
                  <span>{thinking}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
