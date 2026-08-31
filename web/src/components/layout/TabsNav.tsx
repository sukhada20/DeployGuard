"use client";

import React from "react";
import { Activity, GitMerge, FileText, Users } from "lucide-react";

export type TabKey = "operations" | "traces" | "postmortems" | "registry";

interface TabsNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const TabsNav: React.FC<TabsNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: "operations", label: "01. Live Operations & Telemetry", icon: Activity },
    { key: "traces", label: "02. Incident & Decision Traces", icon: GitMerge },
    { key: "postmortems", label: "03. Postmortem SRE Reports", icon: FileText },
    { key: "registry", label: "04. Agent Fleet Registry", icon: Users },
  ];

  return (
    <div className="border-b border-border bg-card/60 px-4 lg:px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono transition-all select-none border whitespace-nowrap ${
                isActive
                  ? "border-foreground bg-foreground text-background font-bold shadow-none"
                  : "border-border/60 bg-muted/20 text-foreground/90 hover:text-foreground hover:border-foreground hover:bg-muted/50 font-medium"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
