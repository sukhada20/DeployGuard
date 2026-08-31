# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Site Reliability Engineers (SREs), Platform Engineers, DevOps Engineers, and Cloud Infrastructure Architects managing multi-service deployments and autonomous rollout safety gates on Google Cloud Platform.

## Product Purpose
DeployGuard is an autonomous, governed safe-deployment fleet designed to detect post-deployment anomalies in real-time, evaluate automated safety policies, execute rollbacks through Google Cloud Deploy, and generate comprehensive postmortem reports with root-cause analysis.

## Positioning
Unlike passive APM dashboards or generic CI/CD pipelines, DeployGuard provides active, deterministic multi-agent governance: a 5-rule safety gate, two-tier IAM authorization, Model Armor prompt injection defense, and automated Cloud Deploy rollback orchestration with sub-40s MTTR.

## Operating Context
Cloud Run, GKE, and Cloud Deploy production environments; incident response rooms; automated CD pipelines; distributed tracing (Cloud Trace / OpenTelemetry); Firestore memory storage.

## Capabilities and Constraints
- 7-dimension statistical anomaly detection (error rate, p95 latency, CPU, memory, crash count, restart count, request rate).
- Deterministic 5-rule policy safety gating before any rollback execution.
- Multi-agent coordination: Deploy Monitor, Decision Agent, Incident Memory, Rollback Agent, Postmortem Agent.
- Real-time SSE streaming for live fleet activity and trace logs.
- Dual theme support: Simple Brutalist Dark Mode & Light Mode.

## Brand Commitments
- Name: DeployGuard
- Visual Philosophy: Simple Brutalism — high contrast black & white foundations, stark geometric structure, crisp borders, monospace numerical precision, and disciplined semantic highlight accents.

## Evidence on Hand
- Full backend FastAPI suite with live SSE telemetry, simulated deployment anomalies, OpenTelemetry trace spans, Firestore persistence, and automated demo runner.
- Comprehensive end-to-end tests and evaluation benchmarks.

## Product Principles
1. Clarity over Clutter: Maximum data density and visual hierarchy without superficial decorative fluff.
2. High-Contrast Scanability: Black and white foundation ensures instantaneous legibility under high-stress incident triage.
3. Purposeful Color: Color is reserved exclusively for semantic signals (incident urgency, health status, anomalous deltas).
4. Deterministic Transparency: Every agent decision, policy rule, and trace span is fully inspectable.
