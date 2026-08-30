# DeployGuard

Fortified enterprise fleet for safe CI/CD operations.

## Overview

DeployGuard is an agentic system that monitors deployments, detects anomalies, reasons over incidents, and safely executes rollbacks. It leverages Google ADK and Gemini to provide a robust, auditable deployment safety net.

## Getting Started

### Prerequisites

- [uv](https://github.com/astral-sh/uv) (for fast Python dependency management)
- Python 3.12+

### Installation

Clone the repository and install dependencies:

```bash
make install
```

### Development

Format code:
```bash
make format
```

Run linter and type checker:
```bash
make lint
```

Run tests:
```bash
make test
```

Run the full verification suite (format, lint, test):
```bash
make verify
```

Run the local development server:
```bash
make dev
```
*(The API will be available at http://127.0.0.1:8000)*

## Architecture

- **Deploy Monitor Agent**: Monitors telemetry for anomalies.
- **Decision Agent**: Evaluates anomalies and determines remediation.
- **Incident Memory Agent**: Stores and retrieves historical incident context.
- **Rollback Agent**: Executes authorized rollbacks.
- **Postmortem Agent**: Generates auditable reports.

## Environment Variables

Copy `.env.example` to `.env` to configure local settings.

```bash
cp .env.example .env
```
