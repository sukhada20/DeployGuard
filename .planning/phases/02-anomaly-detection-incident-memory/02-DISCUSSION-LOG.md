# Phase 2: Anomaly Detection & Incident Memory - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-29
**Phase:** 02-anomaly-detection-incident-memory
**Areas discussed:** Anomaly Baseline Strategy, Log Sanitization Approach

---

## Anomaly Baseline Strategy

### Q1: How should the Deploy Monitor Agent calculate baseline comparisons?

| Option | Description | Selected |
|--------|-------------|----------|
| Configurable ratio-threshold check | Metrics checked against baseline using configurable tolerance ratio | ✓ |
| Statistical Z-score check | Compare metric values to historical sliding-window mean and standard deviation | |
| Static absolute thresholds | Use absolute enterprise-wide limits; no baselines | |

**User's choice:** Configurable ratio-threshold check
**Notes:** Simplest and most robust way to implement without needing complex historical databases or statistical packages.

---

## Log Sanitization Approach

### Q1: How should we implement log sanitization?

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-stage sanitization (Regex + Keyword) | First stage: regex for PII; Second stage: keyword scans for prompt injection | ✓ |
| Regex only | Standard regex to redact PII and credentials | |
| LLM preprocessing | Run all logs through a lightweight sanitization LLM call | |

**User's choice:** Multi-stage sanitization (Regex + Keyword detection)
**Notes:** Lightweight, fast, runs locally.

---

## Agent's Discretion

None — user provided explicit decisions on all questions.

## Deferred Ideas

None — discussion stayed within phase scope.
