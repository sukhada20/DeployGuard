"use client";

import React from "react";
import { Shield, Brain, RotateCcw, FileText, Database, Lock, Key, ShieldCheck, Cpu } from "lucide-react";
import { AgentRegistryModel } from "@/types/api";

interface FleetRegistryViewProps {
  agents?: AgentRegistryModel[];
}

const DEFAULT_AGENTS: AgentRegistryModel[] = [
  {
    agent_id: "deploy-monitor-v1",
    name: "Deploy Monitor Agent",
    version: "1.0.0",
    owner: "Platform Engineering",
    domain: "Monitoring & Observability",
    risk_level: "MEDIUM",
    service_account: "deploy-monitor-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["monitoring.read", "deployment.read", "logging.read"],
    tools: ["get_metrics", "get_baseline", "compare_metrics"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Monitors post-deployment telemetry and baseline comparisons to detect metric anomalies.",
  },
  {
    agent_id: "decision-v2",
    name: "Decision Agent",
    version: "2.0.0",
    owner: "SRE",
    domain: "Release Safety & Policy Evaluation",
    risk_level: "HIGH",
    service_account: "decision-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["monitoring.read", "memory.read", "gemini.invoke"],
    tools: ["gemini_reason", "model_armor_screen", "evaluate_policy"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Synthesizes anomaly signals and historical incidents via Gemini LLM and deterministic safety policies.",
  },
  {
    agent_id: "incident-memory-v1",
    name: "Incident Memory Agent",
    version: "1.0.0",
    owner: "Platform Engineering",
    domain: "Incident Memory & Vector Storage",
    risk_level: "MEDIUM",
    service_account: "incident-memory-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["firestore.read", "firestore.write"],
    tools: ["store_incident", "find_similar_incidents", "query_incidents"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Stores deployment events in Firestore and retrieves similar historical incidents.",
  },
  {
    agent_id: "rollback-v1",
    name: "Rollback Agent",
    version: "1.0.0",
    owner: "SRE",
    domain: "Cloud Deploy & Automated Recovery",
    risk_level: "CRITICAL",
    service_account: "rollback-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["deployment.read", "deployment.rollback", "monitoring.read"],
    tools: ["execute_rollback", "get_rollout_status"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Executes approved rollbacks via Cloud Deploy after strict gateway policy authorization.",
  },
  {
    agent_id: "postmortem-v1",
    name: "Postmortem Agent",
    version: "1.0.0",
    owner: "SRE",
    domain: "Incident Reporting & SRE Synthesis",
    risk_level: "LOW",
    service_account: "postmortem-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["firestore.read", "firestore.write"],
    tools: ["generate_postmortem", "export_markdown"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Generates auditable postmortem documents after incident resolution.",
  },
];

function getAgentIcon(agentId: string) {
  const lower = agentId.toLowerCase();
  if (lower.includes("monitor")) return Shield;
  if (lower.includes("decision")) return Brain;
  if (lower.includes("memory")) return Database;
  if (lower.includes("rollback")) return RotateCcw;
  if (lower.includes("postmortem")) return FileText;
  return Cpu;
}

function getRiskBadge(risk: string) {
  const r = (risk || "LOW").toUpperCase();
  if (r === "CRITICAL") {
    return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  }
  if (r === "HIGH") {
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  }
  if (r === "MEDIUM") {
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  }
  return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
}

export const FleetRegistryView: React.FC<FleetRegistryViewProps> = ({ agents }) => {
  const agentList = agents && agents.length > 0 ? agents : DEFAULT_AGENTS;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentList.map((agent) => {
          const Icon = getAgentIcon(agent.agent_id);
          const tools = Array.isArray(agent.tools) && agent.tools.length > 0 ? agent.tools : [];
          const permissions = Array.isArray(agent.permissions) && agent.permissions.length > 0 ? agent.permissions : [];
          const serviceAccount = agent.service_account || `${agent.agent_id}-sa@deployguard-fleet.iam.gserviceaccount.com`;
          const status = (agent.status || "ACTIVE").toUpperCase();

          return (
            <div
              key={agent.agent_id}
              className="p-4 rounded-xl border border-border bg-card/80 space-y-3 relative overflow-hidden transition-all hover:border-cyan-500/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted/60 border border-border">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground font-mono leading-tight">{agent.name}</h4>
                    <span className="text-[10px] text-muted-foreground font-mono">v{agent.version || "1.0.0"} · {agent.owner || "DeployGuard"}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border font-bold ${getRiskBadge(agent.risk_level)}`}>
                    Risk: {agent.risk_level}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{status}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {agent.description || agent.domain}
              </p>

              <div className="space-y-1.5 text-xs font-mono text-muted-foreground pt-2.5 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Key className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate text-foreground/80">{serviceAccount}</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px]">
                  <Lock className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground/80">Tools:</strong> {tools.length > 0 ? tools.join(", ") : "Standard ADK Tools"}
                  </span>
                </div>
                {permissions.length > 0 && (
                  <div className="flex items-start gap-1.5 text-[11px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground/80">IAM:</strong> {permissions.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* IAM Capability Matrix */}
      <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            GCP IAM & Agent Gateway Capability Matrix
          </h3>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
            Enforced by Two-Tier Gateway
          </span>
        </div>
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
                <td className="p-2.5 text-emerald-400 font-bold">READ</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-foreground">Decision Agent</td>
                <td className="p-2.5 text-muted-foreground">decision-agent-sa</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-emerald-400 font-bold">INFER</td>
                <td className="p-2.5 text-emerald-400 font-bold">READ</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-foreground">Incident Memory</td>
                <td className="p-2.5 text-muted-foreground">incident-memory-sa</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-emerald-400 font-bold">EMBED</td>
                <td className="p-2.5 text-emerald-400 font-bold">READ/WRITE</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-foreground">Rollback Agent</td>
                <td className="p-2.5 text-muted-foreground">rollback-agent-sa</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-rose-400 font-bold">EXECUTE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-foreground">Postmortem Agent</td>
                <td className="p-2.5 text-muted-foreground">postmortem-agent-sa</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-muted-foreground">NONE</td>
                <td className="p-2.5 text-emerald-400 font-bold">INFER</td>
                <td className="p-2.5 text-emerald-400 font-bold">READ/WRITE</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

