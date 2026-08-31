"use client";

import React, { useState } from "react";
import { Download, Copy, Check, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { PostmortemDetail } from "@/types/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface PostmortemDocumentViewerProps {
  postmortem?: PostmortemDetail;
}

export const PostmortemDocumentViewer: React.FC<PostmortemDocumentViewerProps> = ({ postmortem }) => {
  const [copied, setCopied] = useState(false);

  if (!postmortem) {
    return (
      <div className="p-12 text-center text-muted-foreground font-mono text-xs border border-dashed border-border">
        [NO INCIDENT REPORT SELECTED: SELECT A POSTMORTEM IDENTIFIER ABOVE]
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
    <Card className="border-border space-y-5 p-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="destructive" className="text-[10px]">
              {postmortem.severity}
            </Badge>
            <Badge variant="success" className="text-[10px]">
              {postmortem.outcome}
            </Badge>
            <span className="text-[11px] font-mono text-muted-foreground">ID: {postmortem.report_id}</span>
          </div>
          <h2 className="text-lg font-bold font-mono text-foreground uppercase tracking-tight">
            Incident Postmortem: {postmortem.service_name}
          </h2>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            DURATION: {postmortem.incident_duration_seconds.toFixed(1)}S | TARGET: {postmortem.target_version} → STABLE: {postmortem.stable_version}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMarkdown}
            className="h-8 text-xs font-mono gap-1 border-border hover:border-foreground"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </Button>
          <Button
            variant="brutalistPrimary"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="h-8 text-xs font-mono gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJson}
            className="h-8 text-xs font-mono gap-1 border-border hover:border-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
          Executive Summary
        </h3>
        <div className="p-3.5 border border-border bg-muted/20 text-xs text-foreground leading-relaxed font-sans">
          {postmortem.executive_summary}
        </div>
      </div>

      {/* Root Cause Analysis */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
          Root Cause Analysis (5 Whys)
        </h3>
        <div className="p-3.5 border border-border bg-muted/20 text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {postmortem.root_cause_analysis}
        </div>
      </div>

      {/* Telemetry Evidence Table */}
      {postmortem.metric_deltas && Object.keys(postmortem.metric_deltas).length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Telemetry Metric Deltas
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>Incident Peak</TableHead>
                <TableHead>Ratio</TableHead>
                <TableHead>Anomaly Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(postmortem.metric_deltas).map(([metric, d]) => (
                <TableRow key={metric}>
                  <TableCell className="font-bold text-foreground">{metric}</TableCell>
                  <TableCell className="text-muted-foreground">{d.baseline}</TableCell>
                  <TableCell className="text-rose-600 dark:text-rose-400 font-bold">{d.current}</TableCell>
                  <TableCell className="text-rose-600 dark:text-rose-400 font-semibold">
                    +{((d.ratio - 1) * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                      SPIKE ANOMALY
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Preventative Action Items */}
      {postmortem.preventative_actions && postmortem.preventative_actions.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Preventative Action Items
          </h3>
          <div className="p-3.5 border border-border bg-muted/20 space-y-2">
            {postmortem.preventative_actions.map((act, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-foreground font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
