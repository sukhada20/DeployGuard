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
    { key: "operations", label: "Live Operations & Telemetry", icon: Activity },
    { key: "traces", label: "Incidents & Decision Traces", icon: GitMerge },
    { key: "postmortems", label: "Postmortem Reports", icon: FileText },
    { key: "registry", label: "Agent Fleet Registry", icon: Users },
  ];

  return (
    <div className="border-b border-border bg-card/40 px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
