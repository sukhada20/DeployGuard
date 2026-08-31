"use client";

import React, { useState } from "react";
import { Shield, Brain, Database, RotateCcw, FileText, Lock, Key, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AGENTS = [
  {
    id: "deploy-monitor",
    num: "01",
    name: "Deploy Monitor Agent",
    icon: Shield,
    role: "Observability & Metric Baseline Deviation",
    risk: "MEDIUM",
    riskVariant: "outline" as const,
    sa: "deploy-monitor-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["monitoring.read", "deployment.read", "logging.read"],
    tools: ["get_metrics", "get_baseline", "compare_metrics"],
    description: "Monitors real-time telemetry across Cloud Run and GKE workloads. Compares 7 metrics against pre-deployment baselines to detect statistical anomalies.",
  },
  {
    id: "decision-agent",
    num: "02",
    name: "Decision Agent",
    icon: Brain,
    role: "LLM Reasoning & Policy Synthesis",
    risk: "HIGH",
    riskVariant: "warning" as const,
    sa: "decision-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["monitoring.read", "memory.read", "gemini.invoke"],
    tools: ["gemini_reason", "model_armor_screen", "evaluate_policy"],
    description: "Synthesizes anomaly signals and past incident memory using Gemini 2.5 Flash. Applies the deterministic 5-rule safety gate before authorizing any rollback.",
  },
  {
    id: "incident-memory",
    num: "03",
    name: "Incident Memory Agent",
    icon: Database,
    role: "Vector Search & Incident Memory",
    risk: "MEDIUM",
    riskVariant: "outline" as const,
    sa: "incident-memory-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["firestore.read", "firestore.write"],
    tools: ["store_incident", "find_similar_incidents", "query_incidents"],
    description: "Generates embeddings for deployment anomalies and queries Firestore vector index to retrieve analogous historical incidents and verified resolutions.",
  },
  {
    id: "rollback-agent",
    num: "04",
    name: "Rollback Agent",
    icon: RotateCcw,
    role: "Cloud Deploy Execution & Rollout Control",
    risk: "CRITICAL",
    riskVariant: "destructive" as const,
    sa: "rollback-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["deployment.read", "deployment.rollback", "monitoring.read"],
    tools: ["execute_rollback", "get_rollout_status"],
    description: "Executes automated target rollouts to stable versions via Google Cloud Deploy once two-tier IAM gateway authorization and DecisionTrace checks pass.",
  },
  {
    id: "postmortem-agent",
    num: "05",
    name: "Postmortem Agent",
    icon: FileText,
    role: "SRE Report Synthesis & Root Cause Analysis",
    risk: "LOW",
    riskVariant: "success" as const,
    sa: "postmortem-agent-sa@deployguard-fleet.iam.gserviceaccount.com",
    permissions: ["firestore.read", "firestore.write"],
    tools: ["generate_postmortem", "export_markdown"],
    description: "Synthesizes comprehensive SRE postmortems with 5-Whys root cause analysis, metric delta comparison tables, and actionable preventative checklists.",
  },
];

export function FleetShowcase() {
  const [selectedAgentId, setSelectedAgentId] = useState(AGENTS[0].id);
  const activeAgent = AGENTS.find((a) => a.id === selectedAgentId) || AGENTS[0];
  const Icon = activeAgent.icon;

  return (
    <section id="fleet" className="py-16 px-4 lg:px-6 border-b border-border bg-transparent">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="space-y-2 max-w-[65ch]">
          <h2 className="text-2xl sm:text-4xl font-mono font-bold uppercase tracking-tight text-foreground">
            The Five Autonomous Fleet Agents
          </h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            A modular multi-agent system where every agent operates under strict least-privilege IAM service accounts and transparent observability.
          </p>
        </div>

        {/* Interactive Agent Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {AGENTS.map((agent) => {
            const AgentIcon = agent.icon;
            const isSelected = agent.id === selectedAgentId;

            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-3.5 border text-left flex flex-col justify-between space-y-3 transition-all ${
                  isSelected
                    ? "border-foreground bg-foreground text-background shadow-lg"
                    : "border-border bg-card hover:border-foreground text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold">[{agent.num}]</span>
                  <Badge
                    variant={isSelected ? "brutalist" : agent.riskVariant}
                    className="text-[9px] px-1 py-0"
                  >
                    {agent.risk}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <AgentIcon className="w-4 h-4 shrink-0" />
                    <h4 className="font-mono font-bold text-xs uppercase leading-tight truncate">
                      {agent.name}
                    </h4>
                  </div>
                  <p className={`text-[11px] font-mono leading-tight ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                    {agent.role}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Agent Deep Dive Card without wrapping icon box */}
        <Card className="p-6 border-2 border-border bg-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6 text-foreground shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-base uppercase text-foreground">
                    {activeAgent.name}
                  </h3>
                  <Badge variant={activeAgent.riskVariant} className="text-[10px]">
                    RISK: {activeAgent.risk}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {activeAgent.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-muted/40 border border-border text-[11px] font-mono text-foreground font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>ACTIVE FLEET MEMBER</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-foreground font-sans leading-relaxed">
            {activeAgent.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-mono text-xs">
            <div className="p-3 border border-border bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold uppercase">
                <Key className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>GCP Service Account</span>
              </div>
              <div className="text-[11px] text-foreground font-semibold truncate">
                {activeAgent.sa}
              </div>
            </div>

            <div className="p-3 border border-border bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold uppercase">
                <Lock className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>Permitted Tools</span>
              </div>
              <div className="text-[11px] text-foreground font-semibold truncate">
                {activeAgent.tools.join(", ")}
              </div>
            </div>

            <div className="p-3 border border-border bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>IAM Permissions</span>
              </div>
              <div className="text-[11px] text-foreground font-semibold truncate">
                {activeAgent.permissions.join(", ")}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
