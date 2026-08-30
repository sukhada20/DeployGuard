export interface ActiveDeployment {
  service_name: string;
  target_version: string;
  stable_version: string;
  pipeline_status: "monitoring" | "anomaly_detected" | "investigating" | "decision_made" | "rolling_back" | "verifying_recovery" | "complete" | "failed";
  environment: "development" | "staging" | "production";
  deployed_at: string;
}

export interface AgentFleetItem {
  name: string;
  role: string;
  status: "online" | "busy" | "offline";
}

export interface DashboardOverview {
  system_status: "PROTECTED" | "INCIDENT_ACTIVE";
  cluster_health: "HEALTHY" | "DEGRADED";
  active_deployment: ActiveDeployment;
  fleet_summary: {
    total_agents: number;
    active_agents: number;
    agents: AgentFleetItem[];
  };
  metrics_monitored: number;
  incident_statistics: {
    total_deployments: number;
    anomalies_detected: number;
    auto_recovered: number;
    avg_recovery_seconds: number;
    protection_success_rate: number;
  };
  last_updated: string;
}

export interface MetricDetail {
  name: string;
  unit: string;
  current: number;
  baseline: number;
  delta_pct: number;
  is_anomaly: boolean;
  history: number[];
}

export interface TelemetryMetrics {
  service_name: string;
  timestamp: string;
  metrics: {
    error_rate: MetricDetail;
    latency_p95: MetricDetail;
    cpu_utilization: MetricDetail;
    memory_utilization: MetricDetail;
    crash_count: MetricDetail;
    restart_count: MetricDetail;
    request_rate: MetricDetail;
  };
}

export interface TraceSpan {
  name: string;
  duration_ms: number;
  status: string;
  start_offset_ms: number;
}

export interface DecisionTrace {
  trace_id: string;
  service_name: string;
  decision: "wait" | "alert" | "rollback";
  confidence: number;
  evidence_summary: string;
  policy_checks: Record<string, boolean>;
  policy_passed: boolean;
  authorized: boolean;
  authorization_reason: string;
  decided_at: string;
  spans?: TraceSpan[];
}

export interface TimelineEvent {
  timestamp: string;
  stage: string;
  description: string;
}

export interface PostmortemSummary {
  report_id: string;
  deployment_id: string;
  service_name: string;
  target_version: string;
  stable_version: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  outcome: "recovered" | "failed_rollback" | "policy_blocked";
  incident_duration_seconds: number;
  created_at: string;
  executive_summary: string;
}

export interface PostmortemDetail extends PostmortemSummary {
  root_cause_analysis: string;
  timeline_events: TimelineEvent[];
  metric_deltas: Record<string, { baseline: number; current: number; ratio: number }>;
  decision_summary: Record<string, any>;
  rollback_summary: Record<string, any>;
  preventative_actions: string[];
  trace_id?: string;
  markdown: string;
}

export interface AgentRegistryModel {
  agent_id: string;
  name: string;
  version: string;
  owner: string;
  domain: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  service_account: string;
  permissions: string[];
  tools: string[];
  status: "active" | "inactive" | "deprecated";
  created_at: string;
  last_heartbeat: string;
}

export interface AgentEventMessage {
  event: string;
  data: {
    agent_id?: string;
    role?: string;
    action?: string;
    message?: string;
    thinking?: string;
    timestamp?: string;
    payload?: any;
  };
  timestamp: string;
}
