"use client";

import React from "react";
import { Bot, Terminal, Shield, Brain, RotateCcw, FileText, CheckCircle } from "lucide-react";
import { AgentEventMessage } from "@/types/api";

interface AgentActivityFeedProps {
  events: AgentEventMessage[];
  onOpenTerminal: () => void;
}

const getAgentIcon = (role?: string) => {
  switch (role) {
    case "monitor":
    case "deploy_monitor_agent":
      return <Shield className="w-4 h-4 text-cyan-400" />;
    case "decision":
    case "decision_agent":
      return <Brain className="w-4 h-4 text-amber-400" />;
    case "rollback":
    case "rollback_agent":
      return <RotateCcw className="w-4 h-4 text-rose-400" />;
    case "postmortem":
    case "postmortem_agent":
      return <FileText className="w-4 h-4 text-emerald-400" />;
    default:
      return <Bot className="w-4 h-4 text-primary" />;
  }
};

const getRoleBadgeClass = (role?: string) => {
  switch (role) {
    case "monitor":
    case "deploy_monitor_agent":
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    case "decision":
    case "decision_agent":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "rollback":
    case "rollback_agent":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "postmortem":
    case "postmortem_agent":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
};

// Default seed events when SSE is quiet
const DEFAULT_SAMPLE_EVENTS: AgentEventMessage[] = [
  {
    event: "postmortem_ready",
    timestamp: "13:45:08Z",
    data: {
      role: "postmortem_agent",
      action: "REPORT_SYNTHESIZED",
      message: "Postmortem report pm-checkout-service-dep-9942 generated with Gemini narrative and Firestore storage.",
      thinking: "5-Whys root cause analysis synthesized: DB connection timeouts mitigated via rollback.",
    },
  },
  {
    event: "recovery_event",
    timestamp: "13:45:06Z",
    data: {
      role: "deploy_monitor_agent",
      action: "RECOVERY_VERIFIED",
      message: "Recovery verification completed: All 7 metrics returned below 1.15x baseline thresholds. Verdict: recovered.",
      thinking: "Error rate dropped to 0.010, latency restored to 120ms across 3 sampling iterations.",
    },
  },
  {
    event: "rollback_event",
    timestamp: "13:44:48Z",
    data: {
      role: "rollback_agent",
      action: "ROLLOUT_EXECUTED",
      message: "Cloud Deploy rollback executed to stable version v2.3.9. Rollout ID: op-9942.",
      thinking: "Two-tier gateway permission verified and DecisionTrace policy validated.",
    },
  },
  {
    event: "decision_event",
    timestamp: "13:44:34Z",
    data: {
      role: "decision_agent",
      action: "POLICY_AUTHORIZED",
      message: "Decision: rollback (Confidence 0.92). All 5 deterministic policy safety gates PASSED.",
      thinking: "Vertex AI RAG retrieved 3 similar past incidents; Model Armor verified prompt security.",
    },
  },
  {
    event: "anomaly_alert",
    timestamp: "13:44:32Z",
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
    <div className="rounded-xl border border-border bg-card/60 flex flex-col h-full">
      {/* Feed Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground font-mono">
            Autonomous Fleet Activity Stream
          </h3>
        </div>
        <button
          onClick={onOpenTerminal}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Raw Terminal Log</span>
        </button>
      </div>

      {/* Events List */}
      <div className="p-4 space-y-3 overflow-y-auto max-h-[500px]">
        {displayEvents.map((evt, idx) => {
          const role = evt.data?.role || "system";
          const action = evt.data?.action || evt.event;
          const msg = evt.data?.message || JSON.stringify(evt.data);
          const thinking = evt.data?.thinking;
          const time = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : "just now";

          return (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-border/70 bg-background/50 hover:bg-background/80 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-muted/60 border border-border">
                    {getAgentIcon(role)}
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${getRoleBadgeClass(role)}`}>
                    {role}
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-tight">
                    {action}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">{time}</span>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed font-sans">{msg}</p>

              {thinking && (
                <div className="p-2 rounded bg-muted/30 border border-border/40 text-[11px] font-mono text-cyan-300/90 flex items-start gap-1.5">
                  <span className="text-muted-foreground font-bold shrink-0">Reasoning:</span>
                  <span>{thinking}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
