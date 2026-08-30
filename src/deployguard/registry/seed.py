"""Seed data for the Agent Registry — the 5 DeployGuard specialized agents."""

from deployguard.registry.models import AgentRegistryEntry

SEED_AGENTS: list[AgentRegistryEntry] = [
    AgentRegistryEntry(
        agent_id="deploy-monitor-v1",
        name="Deploy Monitor Agent",
        version="1.0.0",
        owner="Platform Engineering",
        domain="Monitoring",
        risk_level="MEDIUM",
        permissions=["monitoring.read", "deployment.read", "logging.read"],
        status="ACTIVE",
        description=(
            "Monitors post-deployment metrics and detects anomalies via "
            "baseline comparison across error rate, latency, crashes, CPU, "
            "memory, restarts, and request rate."
        ),
    ),
    AgentRegistryEntry(
        agent_id="decision-v2",
        name="Decision Agent",
        version="2.0.0",
        owner="SRE",
        domain="Release Safety",
        risk_level="HIGH",
        permissions=["monitoring.read", "memory.read", "gemini.invoke"],
        status="ACTIVE",
        description=(
            "Synthesizes anomaly evidence, historical incidents, and Gemini LLM "
            "reasoning to determine: wait, alert, or rollback. Does NOT execute "
            "rollback directly — separation of duties enforced."
        ),
    ),
    AgentRegistryEntry(
        agent_id="incident-memory-v1",
        name="Incident Memory Agent",
        version="1.0.0",
        owner="Platform Engineering",
        domain="Incident Memory",
        risk_level="MEDIUM",
        permissions=["firestore.read", "firestore.write"],
        status="ACTIVE",
        description=(
            "Stores deployment events, anomaly signals, and incident outcomes "
            "in Firestore. Retrieves similar historical incidents for the "
            "Decision Agent."
        ),
    ),
    AgentRegistryEntry(
        agent_id="rollback-v1",
        name="Rollback Agent",
        version="1.0.0",
        owner="SRE",
        domain="Deployment",
        risk_level="CRITICAL",
        permissions=["deployment.read", "deployment.rollback", "monitoring.read"],
        status="ACTIVE",
        description=(
            "Executes approved rollbacks via Cloud Deploy. Only operates after "
            "gateway authorization. Cannot be invoked directly by Decision Agent — "
            "separation of duties enforced via Agent Gateway."
        ),
    ),
    AgentRegistryEntry(
        agent_id="postmortem-v1",
        name="Postmortem Agent",
        version="1.0.0",
        owner="SRE",
        domain="Reporting",
        risk_level="LOW",
        permissions=["firestore.read", "firestore.write"],
        status="ACTIVE",
        description=(
            "Generates auditable postmortem documents after incident resolution. "
            "Captures timeline, evidence, decisions, actions, and outcomes."
        ),
    ),
]
