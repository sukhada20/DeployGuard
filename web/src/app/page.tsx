"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { TabsNav, TabKey } from "@/components/layout/TabsNav";
import { MetricCards } from "@/components/telemetry/MetricCards";
import { AgentActivityFeed } from "@/components/activity/AgentActivityFeed";
import { TerminalLogDrawer } from "@/components/activity/TerminalLogDrawer";
import { DecisionTraceStepper } from "@/components/traces/DecisionTraceStepper";
import { SpanWaterfall } from "@/components/traces/SpanWaterfall";
import { PostmortemDocumentViewer } from "@/components/postmortem/PostmortemDocumentViewer";
import { FleetRegistryView } from "@/components/registry/FleetRegistryView";
import {
  useDashboardOverview,
  useTelemetryMetrics,
  useDecisionTraces,
  usePostmortems,
  usePostmortemDetail,
  useAgentRegistry,
} from "@/hooks/useDashboardData";
import { useEventStream } from "@/hooks/useEventStream";
import { Activity, ShieldAlert, GitMerge, FileText, Users, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("operations");
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [selectedPostmortemId, setSelectedPostmortemId] = useState<string | null>(null);

  // Queries
  const { data: overview } = useDashboardOverview();
  const { data: telemetry } = useTelemetryMetrics();
  const { data: traces } = useDecisionTraces();
  const { data: postmortems } = usePostmortems();
  const { data: agents } = useAgentRegistry();

  // Active items
  const activeTrace = traces?.find((t) => t.trace_id === (selectedTraceId || traces[0]?.trace_id)) || traces?.[0];
  const activePostmortemSummary = postmortems?.find((p) => p.report_id === (selectedPostmortemId || postmortems[0]?.report_id)) || postmortems?.[0];
  const { data: postmortemDetail } = usePostmortemDetail(activePostmortemSummary?.report_id || null);

  // SSE stream
  const { events, isConnected } = useEventStream();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* 1. Header */}
      <Header overview={overview} isSseConnected={isConnected} />

      {/* 2. Tabs Navigation */}
      <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* TAB 1: Live Operations & Telemetry */}
        {activeTab === "operations" && (
          <div className="space-y-6">
            {/* 7-Dimension Telemetry Cards */}
            <MetricCards telemetry={telemetry} />

            {/* Two-Column Grid: Incident Summary & Activity Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Quick Status & Governance Banner */}
              <div className="space-y-4">
                <div className="p-5 rounded-xl border border-border bg-card/60 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Autonomous Protection SLA
                  </h3>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-background/50 border border-border">
                      <div className="text-2xl font-bold font-mono text-cyan-400">38.4s</div>
                      <div className="text-[11px] text-muted-foreground">Mean Time To Rollback</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border">
                      <div className="text-2xl font-bold font-mono text-emerald-400">100%</div>
                      <div className="text-[11px] text-muted-foreground">Safety Gate Success</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    All rollout operations gated by 5-rule deterministic policy checks and two-tier IAM authorization.
                  </p>
                </div>

                {/* Quick Switch to Decision Traces */}
                <div className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Active Decision Trace</h4>
                    <p className="text-xs text-muted-foreground font-mono">ID: {activeTrace?.trace_id || "tr-20260830-01"}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("traces")}
                    className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Live Fleet Activity Stream */}
              <div className="lg:col-span-2">
                <AgentActivityFeed events={events} onOpenTerminal={() => setIsTerminalOpen(true)} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Incidents & Decision Traces */}
        {activeTab === "traces" && (
          <div className="space-y-6">
            {/* Trace Selector */}
            {traces && traces.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">Select Incident Trace:</span>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {traces.map((t) => (
                    <button
                      key={t.trace_id}
                      onClick={() => setSelectedTraceId(t.trace_id)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                        (selectedTraceId || traces[0]?.trace_id) === t.trace_id
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted border-border"
                      }`}
                    >
                      {t.service_name} ({t.trace_id.slice(-8)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* GSAP Choreographed Governance Stepper */}
            {activeTrace && <DecisionTraceStepper trace={activeTrace} />}

            {/* OpenTelemetry Distributed Waterfall */}
            {activeTrace && <SpanWaterfall traceId={activeTrace.trace_id} spans={activeTrace.spans} />}
          </div>
        )}

        {/* TAB 3: Postmortem Reports */}
        {activeTab === "postmortems" && (
          <div className="space-y-6">
            {/* Postmortem Selector */}
            {postmortems && postmortems.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">Select Incident Report:</span>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {postmortems.map((p) => (
                    <button
                      key={p.report_id}
                      onClick={() => setSelectedPostmortemId(p.report_id)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                        (selectedPostmortemId || postmortems[0]?.report_id) === p.report_id
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted border-border"
                      }`}
                    >
                      {p.service_name} ({p.report_id.slice(-8)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SRE Document Viewer */}
            <PostmortemDocumentViewer postmortem={postmortemDetail} />
          </div>
        )}

        {/* TAB 4: Agent Fleet Registry */}
        {activeTab === "registry" && (
          <FleetRegistryView agents={agents} />
        )}
      </main>

      {/* Terminal Modal Drawer */}
      <TerminalLogDrawer
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        events={events}
      />
    </div>
  );
}
