# Stage 1: Build static Next.js Mission Control dashboard
FROM node:20-slim AS frontend-builder
WORKDIR /app/web

# Copy package files and install dependencies
COPY web/package.json web/package-lock.json* ./
RUN npm ci || npm install

# Copy frontend source code and compile static export
COPY web/ ./
RUN NODE_ENV=production npm run build

# Stage 2: DeployGuard FastAPI Runtime
FROM python:3.12-slim
WORKDIR /app

# Prevent python from writing pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    HOST=0.0.0.0 \
    DEPLOYGUARD_MOCK_GCP=false

# Copy backend requirements and source code
COPY pyproject.toml ./
COPY src/ ./src/

# Copy static frontend export from Stage 1 into web/out
COPY --from=frontend-builder /app/web/out ./web/out

# Install DeployGuard package and dependencies
RUN pip install --no-cache-dir .

EXPOSE 8080

CMD ["sh", "-c", "uvicorn deployguard.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8080}"]

