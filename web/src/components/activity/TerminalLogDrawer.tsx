"use client";

import React, { useState } from "react";
import { Terminal, X, Copy, Check } from "lucide-react";
import { AgentEventMessage } from "@/types/api";

interface TerminalLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: AgentEventMessage[];
}

export const TerminalLogDrawer: React.FC<TerminalLogDrawerProps> = ({ isOpen, onClose, events }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rawLogs = events.map((e) => `[${e.timestamp}] [${e.event}] ${JSON.stringify(e.data, null, 2)}`).join("\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(rawLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[85vh] rounded-xl border border-border bg-[#0a0d14] shadow-2xl flex flex-col overflow-hidden">
        {/* Terminal Header */}
        <div className="px-4 py-3 border-b border-border/80 bg-[#121620] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>DeployGuard Real-Time SSE Event Stream & Trace Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Logs"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 overflow-y-auto font-mono text-xs text-emerald-400 space-y-3 terminal-scroll bg-[#06080d]">
          {events.length === 0 ? (
            <div className="text-muted-foreground">Waiting for SSE events... stream is open and listening.</div>
          ) : (
            events.map((evt, idx) => (
              <div key={idx} className="border-b border-border/20 pb-2">
                <div className="text-cyan-400 font-bold">
                  [{evt.timestamp}] EVENT: {evt.event}
                </div>
                <pre className="text-muted-foreground mt-1 whitespace-pre-wrap text-[11px]">
                  {JSON.stringify(evt.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
