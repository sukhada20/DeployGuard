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
import { IncidentSimulationTrigger } from "@/components/simulation/IncidentSimulationTrigger";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useDashboardOverview,
  useTelemetryMetrics,
  useDecisionTraces,
  usePostmortems,
  usePostmortemDetail,
  useAgentRegistry,
} from "@/hooks/useDashboardData";
import { useEventStream } from "@/hooks/useEventStream";
import { ShieldCheck, Activity, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

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
  const activePostmortemSummary =
    postmortems?.find((p) => p.report_id === (selectedPostmortemId || postmortems[0]?.report_id)) || postmortems?.[0];
  const { data: postmortemDetail } = usePostmortemDetail(activePostmortemSummary?.report_id || null);

  // SSE stream
  const { events, isConnected } = useEventStream();

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground">
      {/* 1. Header */}
      <Header overview={overview} isSseConnected={isConnected} />

      {/* 2. Tabs Navigation */}
      <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-4">
        {/* Interactive Simulation Toolbar */}
        <IncidentSimulationTrigger />

        {/* TAB 1: Live Operations & Telemetry */}
        {activeTab === "operations" && (
          <div className="space-y-4">
            {/* 7-Dimension Telemetry Cards */}
            <MetricCards telemetry={telemetry} />

            {/* Two-Column Grid: Governance SLA & Activity Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column: Protection SLA Banner & Quick Trace Jump */}
              <div className="space-y-3">
                <Card className="p-4 space-y-3 border-border">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-foreground" />
                      Autonomous SLA Protection
                    </h3>
                    <Badge variant="success" className="text-[9px]">ENFORCED</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-muted/30 border border-border">
                      <div className="text-xl font-bold font-mono text-foreground">38.4s</div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">Mean Time To Recover</div>
                    </div>
                    <div className="p-2.5 bg-muted/30 border border-border">
                      <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">100%</div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">Safety Gate Accuracy</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs text-foreground/80 font-sans">
                    <div className="flex items-start gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>5-Rule deterministic safety checks prevent premature or hallucinated rollbacks.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[11px]">
                      <Lock className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                      <span>Two-tier IAM gateway isolates blast radius across Google Cloud services.</span>
                    </div>
                  </div>
                </Card>

                {/* Quick Switch to Decision Traces */}
                <Card className="p-3.5 border-border flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-mono text-foreground uppercase">Active Decision Trace</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      ID: {activeTrace?.trace_id || "tr-20260830-01"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("traces")}
                    className="h-7 text-xs font-mono gap-1 border-border hover:border-foreground"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Card>
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
          <div className="space-y-4">
            {/* Trace Selector */}
            {traces && traces.length > 1 && (
              <div className="flex items-center gap-2 p-2 border border-border bg-card">
                <span className="text-[11px] font-mono text-muted-foreground uppercase px-2">Select Incident Trace:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {traces.map((t) => (
                    <Button
                      key={t.trace_id}
                      variant={(selectedTraceId || traces[0]?.trace_id) === t.trace_id ? "brutalistPrimary" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTraceId(t.trace_id)}
                      className="h-7 text-xs font-mono"
                    >
                      {t.service_name} ({t.trace_id.slice(-8)})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Governance Stepper */}
            {activeTrace && <DecisionTraceStepper trace={activeTrace} />}

            {/* OpenTelemetry Distributed Waterfall */}
            {activeTrace && <SpanWaterfall traceId={activeTrace.trace_id} spans={activeTrace.spans} />}
          </div>
        )}

        {/* TAB 3: Postmortem Reports */}
        {activeTab === "postmortems" && (
          <div className="space-y-4">
            {/* Postmortem Selector */}
            {postmortems && postmortems.length > 1 && (
              <div className="flex items-center gap-2 p-2 border border-border bg-card">
                <span className="text-[11px] font-mono text-muted-foreground uppercase px-2">Select SRE Report:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {postmortems.map((p) => (
                    <Button
                      key={p.report_id}
                      variant={(selectedPostmortemId || postmortems[0]?.report_id) === p.report_id ? "brutalistPrimary" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPostmortemId(p.report_id)}
                      className="h-7 text-xs font-mono"
                    >
                      {p.service_name} ({p.report_id.slice(-8)})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* SRE Document Viewer */}
            <PostmortemDocumentViewer postmortem={postmortemDetail} />
          </div>
        )}

        {/* TAB 4: Agent Fleet Registry */}
        {activeTab === "registry" && <FleetRegistryView agents={agents} />}
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
