"use client";

import React from "react";
import {
  Shield,
  Brain,
  RotateCcw,
  FileText,
  Database,
  Lock,
  Key,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { AgentRegistryModel } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FleetRegistryViewProps {
  agents?: AgentRegistryModel[];
}

const DEFAULT_AGENTS: AgentRegistryModel[] = [
  {
    agent_id: "deploy-monitor-v1",
    name: "Deploy Monitor Agent",
    version: "1.0.0",
    owner: "Platform SRE",
    domain: "Monitoring & Telemetry",
    risk_level: "LOW",
    service_account: "deploy-monitor-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["monitoring.viewer", "logging.viewer"],
    tools: ["timeSeries.list", "entries.list"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Continuously polls 7 Google Cloud Monitoring metrics and logs at 1000ms intervals to compute anomaly standard deviation deltas.",
  },
  {
    agent_id: "incident-memory-v1",
    name: "Incident Memory Agent",
    version: "1.0.0",
    owner: "Platform SRE",
    domain: "Vector RAG & Memory",
    risk_level: "LOW",
    service_account: "incident-memory-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["aiplatform.user", "datastore.viewer"],
    tools: ["text-embedding-004", "firestore.vectorSearch"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Embeds live incident signatures and queries Firestore vector store with Cosine similarity thresholding to surface analogous historical resolutions.",
  },
  {
    agent_id: "decision-v2",
    name: "Decision Agent",
    version: "2.0.0",
    owner: "SRE Governance",
    domain: "LLM Reasoning & 5-Gate Governance",
    risk_level: "MEDIUM",
    service_account: "decision-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["aiplatform.user", "policy.evaluate"],
    tools: ["gemini-1.5-pro", "model_armor_screen", "deterministic_policy_check"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Evaluates incident root cause via Gemini 1.5 Pro reasoning, screened by Model Armor, and strictly enforced through 5 deterministic code gates.",
  },
  {
    agent_id: "rollback-v1",
    name: "Rollback Agent",
    version: "1.0.0",
    owner: "SRE Governance",
    domain: "Cloud Deploy Execution",
    risk_level: "HIGH",
    service_account: "rollback-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["clouddeploy.releaser", "run.developer"],
    tools: ["clouddeploy.rollouts.create", "run.services.update"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Dispatches atomic Cloud Deploy rollbacks to validated stable release targets. Verifies recovery probes across Cloud Run and GKE.",
  },
  {
    agent_id: "postmortem-v1",
    name: "Postmortem Agent",
    version: "1.0.0",
    owner: "SRE Governance",
    domain: "SRE Reporting & Archival",
    risk_level: "LOW",
    service_account: "postmortem-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["aiplatform.user", "datastore.user"],
    tools: ["gemini-1.5-flash", "markdown_export", "firestore.documents.create"],
    status: "ACTIVE",
    created_at: "2026-08-29T10:00:00Z",
    last_heartbeat: "2026-08-30T13:45:00Z",
    description: "Synthesizes auditable Markdown postmortem reports with 5-Whys root cause analysis, telemetry deltas, and preventative action items upon incident resolution.",
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
  if (r === "HIGH" || r === "CRITICAL") {
    return <Badge variant="destructive" className="text-xs font-mono font-bold">RISK: {r}</Badge>;
  }
  if (r === "MEDIUM") {
    return <Badge variant="brutalist" className="text-xs font-mono font-bold">RISK: {r}</Badge>;
  }
  return <Badge variant="success" className="text-xs font-mono font-bold">RISK: {r}</Badge>;
}

export const FleetRegistryView: React.FC<FleetRegistryViewProps> = ({ agents }) => {
  const agentList = agents && agents.length > 0 ? agents : DEFAULT_AGENTS;

  return (
    <div className="space-y-5">
      {/* Top Fleet Header Summary */}
      <Card className="p-5 border-2 border-border bg-card/90 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-mono font-bold uppercase text-foreground">
              Autonomous Agent Fleet Registry
            </h2>
            <Badge variant="brutalist" className="text-xs font-mono font-bold">
              5 AGENTS ONLINE
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">
            Every agent operates under least-privilege IAM service accounts, screened by Model Armor, and evaluated by deterministic safety gates.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-foreground shrink-0">
          <div className="px-3 py-1.5 border-2 border-border bg-muted/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>TWO-TIER GATEWAY ENFORCED</span>
          </div>
        </div>
      </Card>

      {/* Clean 5-Agent Fleet Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentList.map((agent, idx) => {
          const Icon = getAgentIcon(agent.agent_id);
          const tools = Array.isArray(agent.tools) && agent.tools.length > 0 ? agent.tools : [];
          const serviceAccount = agent.service_account || `${agent.agent_id}@gcp`;
          const status = (agent.status || "ACTIVE").toUpperCase();

          return (
            <Card
              key={agent.agent_id}
              className="p-5 border-2 border-border bg-card/90 backdrop-blur-sm hover:border-foreground/80 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-5 h-5 text-foreground shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground font-bold">0{idx + 1}.</span>
                        <h3 className="font-mono font-bold text-sm text-foreground uppercase tracking-tight">
                          {agent.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {agent.domain}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getRiskBadge(agent.risk_level)}
                    <div className="flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{status}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-foreground/90 font-sans leading-relaxed">
                  {agent.description}
                </p>
              </div>

              {/* IAM & Tools Metadata */}
              <div className="space-y-2 pt-3 border-t border-border font-mono text-xs">
                <div className="p-2.5 bg-muted/30 border border-border space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-bold uppercase text-[11px]">
                    <Key className="w-3.5 h-3.5 text-foreground shrink-0" />
                    <span>Service Account:</span>
                  </div>
                  <div className="text-foreground font-bold text-xs truncate" title={serviceAccount}>
                    {serviceAccount}
                  </div>
                </div>

                <div className="p-2.5 bg-muted/30 border border-border space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-bold uppercase text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-foreground shrink-0" />
                    <span>Permitted Tools:</span>
                  </div>
                  <div className="text-foreground font-semibold text-xs truncate">
                    {tools.join(", ")}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
