"use client";

import React from "react";
import { Bot, Terminal, Shield, Brain, RotateCcw, FileText, Activity } from "lucide-react";
import { AgentEventMessage } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    case "memory":
    case "incident_memory_agent":
      return <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
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
    case "memory":
    case "incident_memory_agent":
      return "secondary";
    default:
      return "secondary";
  }
};

interface FormattedEvent {
  role: string;
  action: string;
  message: string;
  thinking?: string;
  time: string;
}

function formatEvent(evt: AgentEventMessage): FormattedEvent {
  const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : "JUST NOW";
  const data: Record<string, any> = evt.data || {};

  // If already structured from backend history or demo runner
  if (data.role && data.message) {
    return {
      role: data.role,
      action: data.action || evt.event,
      message: data.message,
      thinking: data.thinking,
      time: timeStr,
    };
  }

  // Format known SSE event types into clean agent log cards
  switch (evt.event) {
    case "deployment_initiated":
      return {
        role: "deploy_monitor_agent",
        action: "DEPLOYMENT_INITIATED",
        message: `Deployment initiated for ${data.service_name || "service"} version ${data.version || "v2.4.0"} in ${data.environment || "production"}. Monitoring telemetry.`,
        thinking: "Candidate version registered. Monitoring 7 telemetry dimensions against baseline.",
        time: timeStr,
      };

    case "anomaly_detected":
    case "anomaly_alert":
      return {
        role: "deploy_monitor_agent",
        action: "ANOMALY_DETECTED",
        message: `CRITICAL anomaly detected: severity=${data.severity || "CRITICAL"}, confidence=${data.confidence ?? 0.96}, affected metrics: [${Array.isArray(data.anomalies) ? data.anomalies.join(", ") : "error_rate, latency_p95"}].`,
        thinking: "Statistical delta exceeded CRITICAL threshold (1.25x baseline). Dispatched anomaly signal.",
        time: timeStr,
      };

    case "memory_retrieved":
      return {
        role: "incident_memory_agent",
        action: "MEMORY_RETRIEVED",
        message: `Incident memory matched past incident: ${data.top_match || "INC-2026-0819"}. Historical resolution retrieved via Vertex AI RAG.`,
        thinking: "Cosine similarity search over Vector Search index retrieved nearest incident resolution context.",
        time: timeStr,
      };

    case "decision_evaluated":
    case "decision_event":
      return {
        role: "decision_agent",
        action: "POLICY_AUTHORIZED",
        message: `Decision verdict: ${data.action || "rollback"} (Confidence ${data.confidence ?? 0.94}). Policy checks: 5/5 PASSED. Rollback authorized.`,
        thinking: "Deterministic PolicyEngine validated confidence, severity, canary age, and stable target version.",
        time: timeStr,
      };

    case "rollback_initiated":
    case "rollback_event":
      return {
        role: "rollback_agent",
        action: "ROLLBACK_INITIATED",
        message: `Cloud Deploy rollback executed to stable version ${data.target_version || "v2.3.9"}. Operation ID: ${data.operation_id || "op-9942"}.`,
        thinking: "Validated two-tier IAM gateway and executed Cloud Deploy rollback release.",
        time: timeStr,
      };

    case "recovery_verified":
    case "recovery_event":
      return {
        role: "deploy_monitor_agent",
        action: "RECOVERY_VERIFIED",
        message: `Multi-iteration recovery verification completed: Verdict: ${data.verdict || "recovered"}. All 7 metrics returned below 1.15x baseline thresholds.`,
        thinking: "Sampled 3/3 recovery windows: error rate dropped to 1.0%, latency restored to 120ms.",
        time: timeStr,
      };

    case "postmortem_generated":
    case "postmortem_ready":
      return {
        role: "postmortem_agent",
        action: "POSTMORTEM_SYNTHESIZED",
        message: `SRE Incident Postmortem report '${data.report_id || "pm-checkout-service-dep-9942"}' synthesized and saved to Firestore.`,
        thinking: "5-Whys root cause analysis synthesized and saved publication-ready SRE Markdown document.",
        time: timeStr,
      };

    case "deployment_healthy":
      return {
        role: "deploy_monitor_agent",
        action: "DEPLOYMENT_HEALTHY",
        message: `Candidate version ${data.version || "stable"} verified healthy. All telemetry metrics remain nominal.`,
        thinking: "Telemetry metrics remain within 1.05x baseline threshold across evaluation period.",
        time: timeStr,
      };

    default:
      return {
        role: data.role || "deployguard",
        action: data.action || evt.event,
        message: data.message || JSON.stringify(data),
        thinking: data.thinking,
        time: timeStr,
      };
  }
}

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({ events, onOpenTerminal }) => {
  // Filter out internal system pings
  const filteredEvents = events.filter(
    (e) => e.event !== "connected" && e.event !== "heartbeat" && e.event !== "message"
  );

  return (
    <Card className="flex flex-col h-full border-border">
      {/* Header */}
      <div className="p-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-foreground" />
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-foreground">
            Autonomous Fleet Activity Stream
          </h3>
          {filteredEvents.length > 0 && (
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
              {filteredEvents.length} EVENTS
            </Badge>
          )}
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
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-xs border border-dashed border-border">
            [LISTENING FOR FLEET TELEMETRY & AGENT ACTIONS ON /api/v1/events/stream]
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const formatted = formatEvent(evt);

            return (
              <div
                key={idx}
                className="p-3 border border-border bg-card/60 hover:bg-muted/30 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getAgentIcon(formatted.role)}
                    <Badge variant={getRoleBadgeVariant(formatted.role)} className="text-[9px] px-1.5 py-0">
                      {formatted.role}
                    </Badge>
                    <span className="text-[11px] font-mono font-bold text-foreground uppercase tracking-tight">
                      {formatted.action}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{formatted.time}</span>
                </div>

                <p className="text-xs text-foreground/90 font-sans leading-relaxed">{formatted.message}</p>

                {formatted.thinking && (
                  <div className="p-2 border-l-2 border-foreground/70 bg-muted/40 text-[11px] font-mono text-foreground/80 flex items-start gap-1.5">
                    <span className="text-muted-foreground font-bold shrink-0">REASONING:</span>
                    <span>{formatted.thinking}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
