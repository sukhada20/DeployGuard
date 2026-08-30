"use client";

import React from "react";
import { Shield, Brain, RotateCcw, FileText, Database, Lock, Key, Check } from "lucide-react";
import { AgentRegistryModel } from "@/types/api";

interface FleetRegistryViewProps {
  agents?: AgentRegistryModel[];
}

const DEFAULT_AGENTS: AgentRegistryModel[] = [
  {
    agent_id: "deploy-monitor-v1",
    name: "Deploy Monitor Agent",
    version: "1.0.0",
    owner: "SRE Reliability Team",
    domain: "Observability & Metric Baselining",
    risk_level: "LOW",
    service_account: "deploy-monitor-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["monitoring.viewer", "logging.viewer"],
    tools: ["get_metrics", "get_baseline", "compare_metrics"],
    status: "active",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
  },
  {
    agent_id: "decision-v2",
    name: "Decision Agent",
    version: "2.0.0",
    owner: "Platform Architecture Team",
    domain: "Autonomous Policy Evaluation & LLM Reasoning",
    risk_level: "MEDIUM",
    service_account: "decision-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["aiplatform.user", "firestore.viewer"],
    tools: ["gemini_reason", "model_armor_screen", "evaluate_policy"],
    status: "active",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
  },
  {
    agent_id: "incident-memory-v1",
    name: "Incident Memory Agent",
    version: "1.0.0",
    owner: "Data & Knowledge Ops",
    domain: "Vertex AI RAG & Incident Storage",
    risk_level: "LOW",
    service_account: "incident-memory-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["firestore.user", "aiplatform.viewer"],
    tools: ["store_incident", "find_similar_incidents", "query_incidents"],
    status: "active",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
  },
  {
    agent_id: "rollback-v1",
    name: "Rollback Agent",
    version: "1.0.0",
    owner: "Production Operations Team",
    domain: "Cloud Deploy Rollback & Recovery",
    risk_level: "CRITICAL",
    service_account: "rollback-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["clouddeploy.operator", "clouddeploy.releaser"],
    tools: ["execute_rollback", "get_rollout_status"],
    status: "active",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
  },
  {
    agent_id: "postmortem-v1",
    name: "Postmortem Agent",
    version: "1.0.0",
    owner: "Incident Response & Compliance",
    domain: "Postmortem Synthesis & Documentation",
    risk_level: "LOW",
    service_account: "postmortem-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["firestore.user", "aiplatform.user"],
    tools: ["generate_postmortem", "export_markdown"],
    status: "active",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
  },
];

export const FleetRegistryView: React.FC<FleetRegistryViewProps> = ({ agents = DEFAULT_AGENTS }) => {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.agent_id} className="p-4 rounded-xl border border-border bg-card/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground font-mono">{agent.name}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border font-bold ${
                agent.risk_level === "CRITICAL"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : agent.risk_level === "MEDIUM"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}>
                Risk: {agent.risk_level}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{agent.domain}</p>

            <div className="space-y-1 text-xs font-mono text-muted-foreground pt-2 border-t border-border/60">
              <div className="flex items-center gap-1">
                <Key className="w-3 h-3 text-cyan-400" />
                <span className="truncate">{agent.service_account}</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-400" />
                <span>Tools: {agent.tools.join(", ")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* IAM Capability Matrix */}
      <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
          GCP IAM & Agent Gateway Capability Matrix
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-muted/60 text-muted-foreground border-b border-border">
              <tr>
                <th className="p-2.5">Agent Role</th>
                <th className="p-2.5">GCP Service Account</th>
                <th className="p-2.5">Cloud Monitoring</th>
                <th className="p-2.5">Cloud Deploy</th>
                <th className="p-2.5">Vertex AI</th>
                <th className="p-2.5">Firestore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-background/40">
              <tr>
                <td className="p-2.5 font-semibold text-foreground">Deploy Monitor</td>
                <td className="p-2.5 text-muted-foreground">deploy-monitor-sa</td>
                <td className="p-2.5 text-emerald-400">READ</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-foreground">Decision Agent</td>
                <td className="p-2.5 text-muted-foreground">decision-agent-sa</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-emerald-400">INFER</td>
                <td className="p-2.5 text-emerald-400">READ</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-foreground">Incident Memory</td>
                <td className="p-2.5 text-muted-foreground">incident-memory-sa</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-emerald-400">EMBED</td>
                <td className="p-2.5 text-emerald-400">READ/WRITE</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-foreground">Rollback Agent</td>
                <td className="p-2.5 text-muted-foreground">rollback-agent-sa</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-emerald-400">EXECUTE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-foreground">Postmortem Agent</td>
                <td className="p-2.5 text-muted-foreground">postmortem-agent-sa</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-emerald-400">INFER</td>
                <td className="p-2.5 text-emerald-400">READ/WRITE</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
