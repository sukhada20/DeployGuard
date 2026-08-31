"use client";

import React from "react";
import { Activity, GitMerge, FileText, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type TabKey = "operations" | "traces" | "postmortems" | "registry";

interface TabsNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const TabsNav: React.FC<TabsNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      key: "operations" as TabKey,
      num: "01",
      label: "Live Operations & Telemetry",
      desc: "7-Dimension Metrics & SSE Stream",
      icon: Activity,
    },
    {
      key: "traces" as TabKey,
      num: "02",
      label: "Incident & Decision Traces",
      desc: "6-Stage Governance & OTEL Spans",
      icon: GitMerge,
    },
    {
      key: "postmortems" as TabKey,
      num: "03",
      label: "Postmortem SRE Reports",
      desc: "5-Whys Synthesis & Markdown Docs",
      icon: FileText,
    },
    {
      key: "registry" as TabKey,
      num: "04",
      label: "Agent Fleet Registry",
      desc: "5 Active Agents & IAM Boundaries",
      icon: Users,
    },
  ];

  return (
    <Card className="p-4 border-2 border-border bg-card/90 backdrop-blur-sm space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-2.5 px-1">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Console Navigation
        </span>
        <Badge variant="brutalist" className="text-[10px] px-1.5 py-0 font-mono font-bold">
          SRE FLEET
        </Badge>
      </div>

      {/* Vertically Stacked Navigation Tabs */}
      <div className="space-y-2">
        {tabs.map(({ key, num, label, desc, icon: Icon }) => {
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`w-full text-left p-3 border-2 transition-all flex items-start gap-3 select-none ${
                isActive
                  ? "border-foreground bg-foreground text-background shadow-md"
                  : "border-border/80 bg-muted/20 hover:border-foreground text-foreground hover:bg-card"
              }`}
            >
              <div className="pt-0.5 shrink-0">
                <Icon className={`w-4 h-4 ${isActive ? "text-background" : "text-foreground"}`} />
              </div>

              <div className="leading-tight flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`font-mono text-xs font-bold ${isActive ? "text-background/80" : "text-muted-foreground"}`}>
                    {num}.
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-tight truncate">
                    {label}
                  </span>
                </div>
                <p className={`text-[11px] font-sans truncate ${isActive ? "text-background/80" : "text-muted-foreground"}`}>
                  {desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mini Fleet Health Summary in Left Sidebar */}
      <div className="pt-2 border-t border-border/80 space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>FLEET STATUS:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>5/5 ARMORED</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>SAMPLING:</span>
          <span className="text-foreground font-semibold">1000MS INTERVAL</span>
        </div>
      </div>
    </Card>
  );
};
