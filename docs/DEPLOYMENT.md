# Google Cloud Platform Production Deployment Guide 🚀

This document outlines the architecture, IAM provisioning, infrastructure configuration, and deployment procedures for running **DeployGuard** in production on Google Cloud Platform.

---

## 🏛️ GCP Production Architecture

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE CLOUD PLATFORM (GCP)                         │
├────────────────────────────────────────────────────────────────────────────┤
│ 1. COMPUTE LAYER                                                           │
│    • Google Cloud Run: Serves FastAPI app + Next.js static assets          │
│    • Ingress: HTTPS via Cloud Load Balancing + Cloud Armor                 │
│                                                                            │
│ 2. AGENT AI RUNTIME                                                        │
│    • Vertex AI: Gemini 3.5 Flash (`gemini-3.5-flash`)                      │
│    • Vertex AI Model Armor: Prompt Injection & Sensitive Data Redaction    │
│    • Google Agent Development Kit (ADK): Fleet orchestration               │
│                                                                            │
│ 3. PERSISTENCE & MEMORY                                                    │
│    • Cloud Firestore: Native Mode (with Vector Search extension)           │
│    • Collections: `incidents`, `traces`, `postmortems`, `agents`           │
│                                                                            │
│ 4. OBSERVABILITY & TELEMETRY                                               │
│    • Cloud Monitoring: 7-dimensional metric baselines & time-series        │
│    • Cloud Logging: Application and audit log aggregation                  │
│    • Cloud Trace: Distributed OpenTelemetry span propagation              │
│                                                                            │
│ 5. RELEASE & RECOVERY ORCHESTRATION                                        │
│    • Google Cloud Deploy: Delivery pipelines & target rollbacks            │
│    • Cloud Build: Container image compilation & Artifact Registry          │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 1. IAM Service Accounts & Principle of Least Privilege

DeployGuard enforces separation of duties across dedicated Google Cloud Service Accounts:

```bash
PROJECT_ID="your-gcp-project-id"

# 1. Deploy Monitor Service Account
gcloud iam service-accounts create sa-monitor \
    --display-name="DeployGuard Deploy Monitor Agent"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:sa-monitor@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/monitoring.viewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:sa-monitor@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/logging.viewer"

# 2. Incident Memory Service Account
gcloud iam service-accounts create sa-memory \
    --display-name="DeployGuard Incident Memory Agent"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:sa-memory@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

# 3. Decision Agent Service Account
gcloud iam service-accounts create sa-decision \
    --display-name="DeployGuard Decision Reasoning Agent"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:sa-decision@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# 4. Rollback Agent Service Account (HIGH PRIVILEGE)
gcloud iam service-accounts create sa-rollback \
    --display-name="DeployGuard Rollback Execution Agent"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:sa-rollback@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/clouddeploy.releaserAdmin"

# 5. Postmortem Agent Service Account
gcloud iam service-accounts create sa-postmortem \
    --display-name="DeployGuard Postmortem Synthesis Agent"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:sa-postmortem@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/datastore.user"
```

---

## 💾 2. Cloud Firestore Database Setup

1. Create a Firestore Database in Native mode:
```bash
gcloud firestore databases create \
    --location="us-central1" \
    --type=firestore-native
```

2. Enable Firestore Vector Search for Incident Memory:
```bash
# Create vector index on incidents collection
gcloud firestore indexes composite create \
    --collection-group=incidents \
    --query-scope=COLLECTION \
    --field-config=vector-config='{"dimension":"768","flat":{}}',field-path=embedding \
    --field-config=order=ASCENDING,field-path=service_name
```

---

## ⚙️ 3. Production Environment Variables (`.env`)

Configure the production environment settings:

```env
# GCP Environment
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
ENVIRONMENT=production

# Model & Reasoning
GEMINI_MODEL=gemini-3.5-flash
MOCK_GCP=false
USE_LIVE_GCP=true

# Security Gate Configuration
MIN_CONFIDENCE_THRESHOLD_PROD=0.85
MIN_CONFIDENCE_THRESHOLD_STAGE=0.70
MAX_DEPLOYMENT_AGE_SECONDS=1800

# OpenTelemetry & Tracing
OTEL_SERVICE_NAME=deployguard-fleet
OTEL_EXPORTER_OTLP_ENDPOINT=https://cloudtrace.googleapis.com
```

---

## 🐳 4. Build & Container Deployment (Cloud Run)

### Dockerfile
```dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y curl build-essential nodejs npm && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install Python dependencies
COPY pyproject.toml .
RUN uv venv /opt/venv && uv pip install --no-cache-dir .

# Build Next.js Dashboard
COPY web/ web/
RUN cd web && npm install && npm run build

# Final Stage
FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app/web/out /app/web/out
COPY src/ src/

ENV PATH="/opt/venv/bin:$PATH"
ENV PORT=8080

EXPOSE 8080
CMD ["uvicorn", "deployguard.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Build & Deploy Commands
```bash
# 1. Build container image via Google Cloud Build
gcloud builds submit --tag gcr.io/${PROJECT_ID}/deployguard:latest .

# 2. Deploy to Google Cloud Run
gcloud run deploy deployguard \
    --image gcr.io/${PROJECT_ID}/deployguard:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars GOOGLE_CLOUD_PROJECT=${PROJECT_ID},USE_LIVE_GCP=true,MOCK_GCP=false \
    --memory 2Gi \
    --cpu 2 \
    --min-instances 1 \
    --max-instances 10
```

---

## 🔍 5. Verification & Health Check

After deployment, test the production service health:

```bash
# Verify API Health endpoint
curl -f https://deployguard-xyz-uc.a.run.app/api/v1/health

# Output:
# {"status":"healthy","version":"0.1.0","agents_active":5,"gcp_connected":true}
```
