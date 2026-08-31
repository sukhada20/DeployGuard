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
import { ShieldCheck, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-transparent text-foreground relative z-10">
      {/* 1. Top Header */}
      <Header overview={overview} isSseConnected={isConnected} />

      {/* 2. Main SRE Workspace with Left-Side Vertical Navigation */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start">
        {/* Left-Hand Vertical Navigation Sidebar */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
          {/* Vertically Stacked Console Tabs */}
          <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Autonomous SLA Protection Section */}
          <Card className="p-4 space-y-3.5 border-2 border-border bg-card/90 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-foreground" />
                <span>Autonomous Protection SLA</span>
              </h3>
              <Badge variant="success" className="text-[10px] font-mono font-bold">ENFORCED</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-muted/30 border-2 border-border">
                <div className="text-xl font-black font-mono text-foreground">38.4s</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">Mean Time To Recover</div>
              </div>
              <div className="p-2.5 bg-muted/30 border-2 border-border">
                <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">100%</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">Safety Accuracy</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-xs text-foreground/90 font-sans leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>5 deterministic rules prevent hallucinated rollbacks.</span>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                <span>Two-tier IAM gateway isolates blast radius.</span>
              </div>
            </div>
          </Card>

          {/* Trigger Anomaly Rollback Section (Placed directly below Autonomous Protection SLA) */}
          <IncidentSimulationTrigger />

          {/* Quick Active Trace Card */}
          <Card className="p-3.5 border-2 border-border bg-card/90 backdrop-blur-sm flex items-center justify-between shadow-sm">
            <div>
              <h4 className="text-xs font-bold font-mono text-foreground uppercase">Active Decision Trace</h4>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate max-w-[160px]">
                ID: {activeTrace?.trace_id || "tr-20260830-01"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("traces")}
              className="h-7 text-xs font-mono font-bold gap-1 border-border hover:border-foreground"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Card>
        </aside>

        {/* Right Main Content Workspace */}
        <section className="flex-1 min-w-0 w-full space-y-6">
          {/* TAB 1: Live Operations & Telemetry */}
          {activeTab === "operations" && (
            <div className="space-y-6">
              {/* 7-Dimension Telemetry Cards */}
              <MetricCards telemetry={telemetry} />

              {/* Live Fleet Activity Stream */}
              <AgentActivityFeed events={events} onOpenTerminal={() => setIsTerminalOpen(true)} />
            </div>
          )}

          {/* TAB 2: Incidents & Decision Traces */}
          {activeTab === "traces" && (
            <div className="space-y-5">
              {/* Trace Selector */}
              {traces && traces.length > 1 && (
                <div className="flex items-center gap-3 p-3 border-2 border-border bg-card/90 backdrop-blur-sm">
                  <span className="text-xs font-mono font-bold text-muted-foreground uppercase px-1">Select Trace:</span>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {traces.map((t) => (
                      <Button
                        key={t.trace_id}
                        variant={(selectedTraceId || traces[0]?.trace_id) === t.trace_id ? "brutalistPrimary" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTraceId(t.trace_id)}
                        className="h-8 text-xs font-mono font-bold"
                      >
                        {t.service_name} ({t.trace_id.slice(-8)})
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Governance Vertical Stepper */}
              {activeTrace && <DecisionTraceStepper trace={activeTrace} />}

              {/* OpenTelemetry Distributed Waterfall */}
              {activeTrace && <SpanWaterfall traceId={activeTrace.trace_id} spans={activeTrace.spans} />}
            </div>
          )}

          {/* TAB 3: Postmortem Reports */}
          {activeTab === "postmortems" && (
            <div className="space-y-5">
              {/* Postmortem Selector */}
              {postmortems && postmortems.length > 1 && (
                <div className="flex items-center gap-3 p-3 border-2 border-border bg-card/90 backdrop-blur-sm">
                  <span className="text-xs font-mono font-bold text-muted-foreground uppercase px-1">Select Report:</span>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {postmortems.map((p) => (
                      <Button
                        key={p.report_id}
                        variant={(selectedPostmortemId || postmortems[0]?.report_id) === p.report_id ? "brutalistPrimary" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPostmortemId(p.report_id)}
                        className="h-8 text-xs font-mono font-bold"
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
        </section>
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
