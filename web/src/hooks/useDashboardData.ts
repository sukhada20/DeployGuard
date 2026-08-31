"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DashboardOverview,
  TelemetryMetrics,
  DecisionTrace,
  PostmortemSummary,
  PostmortemDetail,
  AgentRegistryModel,
} from "@/types/api";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:8000";
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = getApiBase();
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  }
  return res.json();
}

export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard", "overview"],
    queryFn: () => fetchJson<DashboardOverview>("/api/v1/dashboard/overview"),
    refetchInterval: 3000,
  });
}

export function useTelemetryMetrics() {
  return useQuery<TelemetryMetrics>({
    queryKey: ["dashboard", "metrics"],
    queryFn: () => fetchJson<TelemetryMetrics>("/api/v1/dashboard/metrics"),
    refetchInterval: 2000,
  });
}

export function useDecisionTraces() {
  return useQuery<DecisionTrace[]>({
    queryKey: ["traces"],
    queryFn: () => fetchJson<DecisionTrace[]>("/api/v1/traces"),
    refetchInterval: 5000,
  });
}

export function usePostmortems() {
  return useQuery<PostmortemSummary[]>({
    queryKey: ["postmortems"],
    queryFn: () => fetchJson<PostmortemSummary[]>("/api/v1/postmortems"),
    refetchInterval: 5000,
  });
}

export function usePostmortemDetail(reportId: string | null) {
  return useQuery<PostmortemDetail>({
    queryKey: ["postmortems", reportId],
    queryFn: () => fetchJson<PostmortemDetail>(`/api/v1/postmortems/${reportId}`),
    enabled: !!reportId,
  });
}

export function useAgentRegistry() {
  return useQuery<AgentRegistryModel[]>({
    queryKey: ["registry", "agents"],
    queryFn: () => fetchJson<AgentRegistryModel[]>("/api/v1/registry/agents"),
    refetchInterval: 10000,
  });
}
