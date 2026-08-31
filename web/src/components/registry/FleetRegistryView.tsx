"use client";

import React from "react";
import { Shield, Brain, RotateCcw, FileText, Database, Lock, Key, ShieldCheck, Cpu } from "lucide-react";
import { AgentRegistryModel } from "@/types/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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

function getRiskVariant(risk: string): "destructive" | "warning" | "info" | "success" {
  const r = (risk || "LOW").toUpperCase();
  if (r === "CRITICAL") return "destructive";
  if (r === "HIGH") return "warning";
  if (r === "MEDIUM") return "info";
  return "success";
}

export const FleetRegistryView: React.FC<FleetRegistryViewProps> = ({ agents }) => {
  const agentList = agents && agents.length > 0 ? agents : DEFAULT_AGENTS;

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {agentList.map((agent) => {
          const Icon = getAgentIcon(agent.agent_id);
          const tools = Array.isArray(agent.tools) && agent.tools.length > 0 ? agent.tools : [];
          const permissions = Array.isArray(agent.permissions) && agent.permissions.length > 0 ? agent.permissions : [];
          const serviceAccount = agent.service_account || `${agent.agent_id}-sa@deployguard-fleet.iam.gserviceaccount.com`;
          const status = (agent.status || "ACTIVE").toUpperCase();

          return (
            <Card
              key={agent.agent_id}
              className="p-3.5 flex flex-col justify-between space-y-3 border-border hover:border-foreground/50 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-foreground shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-foreground font-mono leading-tight">{agent.name}</h4>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        v{agent.version || "1.0.0"} · {agent.owner || "DeployGuard"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={getRiskVariant(agent.risk_level)} className="text-[9px] px-1.5 py-0">
                      RISK: {agent.risk_level}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-500" />
                      <span>{status}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-foreground/80 font-sans leading-relaxed">
                  {agent.description || agent.domain}
                </p>
              </div>

              <div className="space-y-1 text-xs font-mono text-muted-foreground pt-2.5 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Key className="w-3 h-3 text-foreground shrink-0" />
                  <span className="truncate text-foreground/90">{serviceAccount}</span>
                </div>
                <div className="flex items-start gap-1.5 text-[10px]">
                  <Lock className="w-3 h-3 text-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Tools:</strong> {tools.length > 0 ? tools.join(", ") : "Standard ADK"}
                  </span>
                </div>
                {permissions.length > 0 && (
                  <div className="flex items-start gap-1.5 text-[10px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">IAM:</strong> {permissions.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* IAM Capability Matrix */}
      <Card className="border-border space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            GCP IAM & Agent Gateway Capability Matrix
          </h3>
          <Badge variant="brutalist" className="text-[10px]">
            ENFORCED BY TWO-TIER GATEWAY
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Role</TableHead>
              <TableHead>GCP Service Account</TableHead>
              <TableHead>Cloud Monitoring</TableHead>
              <TableHead>Cloud Deploy</TableHead>
              <TableHead>Vertex AI</TableHead>
              <TableHead>Firestore</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-bold text-foreground">Deploy Monitor</TableCell>
              <TableCell className="text-muted-foreground">deploy-monitor-sa</TableCell>
              <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold">READ</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold text-foreground">Decision Agent</TableCell>
              <TableCell className="text-muted-foreground">decision-agent-sa</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold">INFER</TableCell>
              <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold">READ</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold text-foreground">Incident Memory</TableCell>
              <TableCell className="text-muted-foreground">incident-memory-sa</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold">EMBED</TableCell>
              <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold">READ/WRITE</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold text-foreground">Rollback Agent</TableCell>
              <TableCell className="text-muted-foreground">rollback-agent-sa</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-rose-600 dark:text-rose-400 font-bold">EXECUTE</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold text-foreground">Postmortem Agent</TableCell>
              <TableCell className="text-muted-foreground">postmortem-agent-sa</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-muted-foreground">NONE</TableCell>
              <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold">INFER</TableCell>
              <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold">READ/WRITE</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
