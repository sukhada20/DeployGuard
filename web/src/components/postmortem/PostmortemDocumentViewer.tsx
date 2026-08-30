"use client";

import React, { useState } from "react";
import { Download, Copy, Check, FileText, AlertCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PostmortemDetail } from "@/types/api";

interface PostmortemDocumentViewerProps {
  postmortem?: PostmortemDetail;
}

export const PostmortemDocumentViewer: React.FC<PostmortemDocumentViewerProps> = ({ postmortem }) => {
  const [copied, setCopied] = useState(false);

  if (!postmortem) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
        No postmortem report selected. Select an incident report to view the SRE analysis.
      </div>
    );
  }

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(postmortem.markdown || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([postmortem.markdown || ""], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${postmortem.report_id}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(postmortem, null, 2)], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = `${postmortem.report_id}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="rounded-xl border border-border bg-card/70 overflow-hidden space-y-6 p-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
              {postmortem.severity}
            </span>
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              {postmortem.outcome}
            </span>
            <span className="text-xs font-mono text-muted-foreground">ID: {postmortem.report_id}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-2 tracking-tight">
            Incident Postmortem: {postmortem.service_name}
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Duration: {postmortem.incident_duration_seconds.toFixed(1)}s | Target: {postmortem.target_version} → Stable: {postmortem.stable_version}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy MD"}</span>
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
          Executive Summary
        </h3>
        <div className="p-4 rounded-lg bg-background/60 border border-border/70 text-sm text-foreground/90 leading-relaxed font-sans">
          {postmortem.executive_summary}
        </div>
      </div>

      {/* Root Cause Analysis */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
          Root Cause Analysis (5 Whys)
        </h3>
        <div className="p-4 rounded-lg bg-background/60 border border-border/70 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {postmortem.root_cause_analysis}
        </div>
      </div>

      {/* Telemetry Evidence Table */}
      {postmortem.metric_deltas && Object.keys(postmortem.metric_deltas).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Telemetry Metric Deltas
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted/60 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-2.5">Metric</th>
                  <th className="p-2.5">Baseline</th>
                  <th className="p-2.5">Incident Peak</th>
                  <th className="p-2.5">Ratio</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-background/40">
                {Object.entries(postmortem.metric_deltas).map(([metric, d]) => (
                  <tr key={metric}>
                    <td className="p-2.5 font-semibold text-foreground">{metric}</td>
                    <td className="p-2.5 text-muted-foreground">{d.baseline}</td>
                    <td className="p-2.5 text-rose-400 font-bold">{d.current}</td>
                    <td className="p-2.5 text-rose-400">+{((d.ratio - 1) * 100).toFixed(0)}%</td>
                    <td className="p-2.5 text-rose-400 font-semibold">ANOMALY</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preventative Action Items */}
      {postmortem.preventative_actions && postmortem.preventative_actions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Preventative Action Items
          </h3>
          <div className="p-4 rounded-lg bg-background/60 border border-border/70 space-y-2">
            {postmortem.preventative_actions.map((act, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
