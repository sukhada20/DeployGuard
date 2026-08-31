"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check, X } from "lucide-react";
import { AgentEventMessage } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TerminalLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: AgentEventMessage[];
}

export const TerminalLogDrawer: React.FC<TerminalLogDrawerProps> = ({ isOpen, onClose, events }) => {
  const [copied, setCopied] = useState(false);

  const rawLogs = events.map((e) => `[${e.timestamp}] [${e.event}] ${JSON.stringify(e.data, null, 2)}`).join("\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(rawLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 border-border bg-card overflow-hidden">
        {/* Terminal Header */}
        <DialogHeader className="px-4 py-3 border-b border-border bg-muted/40 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2 font-mono text-xs text-foreground font-bold uppercase">
            <Terminal className="w-4 h-4 text-foreground" />
            <DialogTitle className="text-xs font-mono font-bold">
              Real-Time SSE Event Stream & Raw Telemetry Terminal
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 pr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-[11px] font-mono gap-1 border-border hover:border-foreground"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy Logs"}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Terminal Body */}
        <div className="p-4 overflow-y-auto max-h-[70vh] font-mono text-xs space-y-3 bg-card terminal-scroll">
          {events.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              [WAITING FOR SSE EVENT FRAMES: LISTENING ON /api/v1/events/stream]
            </div>
          ) : (
            events.map((evt, idx) => (
              <div key={idx} className="border-b border-border/40 pb-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-foreground font-bold">
                  <span>[{evt.timestamp || "STREAM_EVENT"}] {evt.event}</span>
                  <span className="text-muted-foreground text-[10px] uppercase font-mono">FRAME #{idx + 1}</span>
                </div>
                <pre className="text-muted-foreground whitespace-pre-wrap text-[11px] bg-muted/30 p-2 border border-border/40 overflow-x-auto">
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
