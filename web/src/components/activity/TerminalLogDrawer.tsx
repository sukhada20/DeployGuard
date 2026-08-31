"use client";

import React, { useState, useMemo } from "react";
import { Terminal, Copy, Check, Trash2, Download, Search, Pause, Play, Filter } from "lucide-react";
import { AgentEventMessage } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TerminalLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: AgentEventMessage[];
  onClearLogs?: () => void;
}

export const TerminalLogDrawer: React.FC<TerminalLogDrawerProps> = ({
  isOpen,
  onClose,
  events,
  onClearLogs,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [isPaused, setIsPaused] = useState(false);

  // Filter events based on search query and category filter
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Category filter
      if (selectedFilter === "ANOMALY" && !evt.event.includes("anomaly")) return false;
      if (selectedFilter === "DECISION" && !evt.event.includes("decision")) return false;
      if (selectedFilter === "ROLLBACK" && !evt.event.includes("rollback")) return false;
      if (selectedFilter === "POSTMORTEM" && !evt.event.includes("postmortem")) return false;
      if (selectedFilter === "METRICS" && !evt.event.includes("metric")) return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const eventNameMatches = evt.event.toLowerCase().includes(q);
      const timestampMatches = (evt.timestamp || "").toLowerCase().includes(q);
      const payloadMatches = JSON.stringify(evt.data || {}).toLowerCase().includes(q);

      return eventNameMatches || timestampMatches || payloadMatches;
    });
  }, [events, searchQuery, selectedFilter]);

  const rawLogsString = useMemo(() => {
    return filteredEvents
      .map((e, i) => `--- FRAME #${i + 1} [${e.timestamp}] [${e.event}] ---\n${JSON.stringify(e.data, null, 2)}`)
      .join("\n\n");
  }, [filteredEvents]);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(rawLogsString);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (evt: AgentEventMessage, idx: number) => {
    const singleStr = `[${evt.timestamp || "STREAM_EVENT"}] ${evt.event}\n${JSON.stringify(evt.data, null, 2)}`;
    navigator.clipboard.writeText(singleStr);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(filteredEvents, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deployguard-sse-telemetry-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[88vh] p-0 gap-0 border-2 border-border bg-card overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <DialogHeader className="px-4 py-3 border-b-2 border-border bg-muted/40 flex-col sm:flex-row items-start sm:items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2 font-mono text-xs text-foreground font-bold uppercase">
            <Terminal className="w-4 h-4 text-foreground" />
            <DialogTitle className="text-xs font-mono font-bold">
              Real-Time SSE Telemetry & Event Inspector
            </DialogTitle>

            {isPaused && (
              <Badge variant="warning" className="text-[9px] font-mono px-1.5 py-0">
                PAUSED
              </Badge>
            )}
          </div>

          {/* Header Actions: Copy, Clear, Download, Pause */}
          <div className="flex items-center gap-2 flex-wrap sm:pr-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="h-7 text-[11px] font-mono gap-1 border-border hover:border-foreground"
              title={isPaused ? "Resume Live Stream" : "Pause Live Stream"}
            >
              {isPaused ? <Play className="w-3 h-3 text-emerald-500" /> : <Pause className="w-3 h-3" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              disabled={filteredEvents.length === 0}
              className="h-7 text-[11px] font-mono gap-1 border-border hover:border-foreground"
            >
              {copiedAll ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedAll ? "Copied All" : "Copy All"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={filteredEvents.length === 0}
              className="h-7 text-[11px] font-mono gap-1 border-border hover:border-foreground"
            >
              <Download className="w-3 h-3" />
              <span>Export JSON</span>
            </Button>

            {onClearLogs && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onClearLogs}
                disabled={events.length === 0}
                className="h-7 text-[11px] font-mono gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Toolbar: Search & Filter Pills */}
        <div className="p-3 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search event type, timestamp, payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-card border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <Filter className="w-3 h-3 text-muted-foreground shrink-0 ml-1 mr-0.5" />
            {["ALL", "ANOMALY", "DECISION", "ROLLBACK", "POSTMORTEM", "METRICS"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase transition-colors border ${
                  selectedFilter === filter
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted/30 text-muted-foreground border-border hover:border-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 overflow-y-auto max-h-[65vh] font-mono text-xs space-y-3 bg-card terminal-scroll">
          {filteredEvents.length === 0 ? (
            <div className="text-muted-foreground text-center py-12 space-y-2">
              <div className="text-xs uppercase font-mono font-bold">
                [NO SSE FRAMES MATCH CURRENT FILTER]
              </div>
              <p className="text-[11px] text-muted-foreground">
                Listening on SSE stream endpoint <code className="text-foreground font-bold">/api/v1/events/stream</code>
              </p>
            </div>
          ) : (
            filteredEvents.map((evt, idx) => (
              <div key={idx} className="border border-border/60 bg-muted/20 p-3 space-y-2 group">
                <div className="flex items-center justify-between text-[11px] text-foreground font-bold border-b border-border/40 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-mono uppercase bg-card px-1.5 py-0">
                      {evt.event}
                    </Badge>
                    <span className="text-muted-foreground text-[10px]">
                      [{evt.timestamp || "STREAM_EVENT"}]
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px] uppercase font-mono">
                      FRAME #{filteredEvents.length - idx}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySingle(evt, idx)}
                      className="h-6 px-1.5 text-[10px] gap-1 font-mono hover:bg-muted"
                      title="Copy single frame JSON"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                      )}
                      <span className="text-[10px]">{copiedIndex === idx ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </div>

                <pre className="text-muted-foreground whitespace-pre-wrap text-[11px] bg-card p-2.5 border border-border/40 overflow-x-auto selection:bg-foreground selection:text-background">
                  {JSON.stringify(evt.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
