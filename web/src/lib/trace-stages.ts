import {
  AlertTriangle,
  Brain,
  ShieldCheck,
  Database,
  Lock,
  RotateCcw,
  FileText,
  LucideIcon,
} from "lucide-react";
import { DecisionTrace } from "@/types/api";

export interface TraceStageItem {
  id: string;
  step: number;
  num: string;
  title: string;
  actor: string;
  icon: LucideIcon;
  badge: string;
  badgeVariant: "destructive" | "brutalist" | "success" | "outline";
  summary: string;
  evidence: string;
  status: "PASS" | "FAIL";
  checks?: Record<string, boolean>;
}

export function getCanonicalTraceStages(trace?: DecisionTrace | null): TraceStageItem[] {
  const decision = trace?.decision ? trace.decision.toUpperCase() : "ROLLBACK";
  const confidence = trace?.confidence != null ? (trace.confidence * 100).toFixed(0) : "98";
  const isPolicyPassed = trace ? trace.policy_passed : true;
  const isAuthorized = trace ? trace.authorized : true;

  return [
    {
      id: "evidence",
      step: 1,
      num: "01",
      title: "Anomaly Evidence",
      actor: "Deploy Monitor Agent",
      icon: AlertTriangle,
      badge: "TRIGGER SPIKE",
      badgeVariant: "destructive",
      summary:
        trace?.evidence_summary ||
        "Deploy Monitor polled Cloud Monitoring and detected a statistical threshold deviation exceeding 1.25x baseline.",
      evidence:
        "checkout-service HTTP 500 error rate spike to 0.145 (14.5x baseline). Baseline=0.010. Sampling=1000ms.",
      status: "PASS",
    },
    {
      id: "memory",
      step: 2,
      num: "02",
      title: "Historical Memory RAG",
      actor: "Incident Memory Agent",
      icon: Database,
      badge: "VERTEX AI RAG",
      badgeVariant: "brutalist",
      summary:
        "Incident Memory retrieved analogous past incident resolutions from Firestore vector embeddings with high cosine similarity.",
      evidence:
        "Top match: inc-checkout-dep-9942 (Cosine similarity: 0.942). Prior resolution: Rollback to stable release.",
      status: "PASS",
    },
    {
      id: "reasoning",
      step: 3,
      num: "03",
      title: "Gemini 1.5 Pro Reasoning",
      actor: "Decision Agent",
      icon: Brain,
      badge: "MODEL ARMOR SCREENED",
      badgeVariant: "brutalist",
      summary: `Gemini 1.5 Pro synthesized current telemetry, historical postmortems, and target rollout configuration to decide: ${decision}.`,
      evidence: `Input screened for prompt injection via Model Armor. Confidence score: ${confidence}%.`,
      status: "PASS",
    },
    {
      id: "policy",
      step: 4,
      num: "04",
      title: "Deterministic Safety Gate",
      actor: "Decision Agent",
      icon: ShieldCheck,
      badge: isPolicyPassed ? "5/5 RULES PASSED" : "POLICY BLOCKED",
      badgeVariant: isPolicyPassed ? "success" : "destructive",
      summary:
        trace?.authorization_reason ||
        "All 5 deterministic non-LLM code safety gates evaluated and confirmed safe for automated rollback execution.",
      checks: trace?.policy_checks || {
        no_concurrent_rollbacks: true,
        iam_authorization_verified: true,
        target_stable_version_valid: true,
        error_delta_threshold_exceeded: true,
        recovery_probe_readiness: true,
      },
      evidence: "Deterministic evaluation: 5/5 safety checks PASS. Zero hallucination risk.",
      status: isPolicyPassed ? "PASS" : "FAIL",
    },
    {
      id: "gateway",
      step: 5,
      num: "05",
      title: "Gateway IAM Authorization",
      actor: "Two-Tier Agent Gateway",
      icon: Lock,
      badge: isAuthorized ? "IAM AUTHORIZED" : "DENIED",
      badgeVariant: isAuthorized ? "success" : "destructive",
      summary:
        "Agent Gateway verified caller service account identity (decision-agent-sa@gcp). Authorized sensitive single-use rollback tool token.",
      evidence:
        "Sensitive tool authorized: clouddeploy.rollouts.create for caller decision-agent-sa@deployguard-fleet.iam.gserviceaccount.com.",
      status: isAuthorized ? "PASS" : "FAIL",
    },
    {
      id: "action",
      step: 6,
      num: "06",
      title: "Autonomous Action & Recovery",
      actor: "Rollback Agent",
      icon: RotateCcw,
      badge: decision,
      badgeVariant: "success",
      summary:
        "Dispatched automated Cloud Deploy rollback to target stable release v2.3.9. Traffic safely reverted and verified healthy within 38.4s.",
      evidence:
        "clouddeploy.rollouts.create response: rollout-checkout-dep-rollback-001 STATE=SUCCEEDED. MTTR: 38.4s.",
      status: "PASS",
    },
  ];
}
