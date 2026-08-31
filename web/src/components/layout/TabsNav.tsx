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
    <div className="border-b border-border bg-background/60 backdrop-blur-md px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-mono transition-all select-none border-2 whitespace-nowrap ${
                isActive
                  ? "border-foreground bg-foreground text-background font-bold shadow-sm"
                  : "border-border/80 bg-card/60 text-foreground/80 hover:text-foreground hover:border-foreground hover:bg-card font-medium"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
