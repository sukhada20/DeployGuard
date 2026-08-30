.PHONY: all install test eval lint format dev verify clean demo demo-auto demo-ci demo-security demo-security-gateway demo-security-injection demo-clean

# Default target
all: verify

# Install dependencies using uv
install:
	@echo "Installing dependencies..."
	@uv venv .venv || true
	@uv pip install -e ".[dev]"
	@cd web && npm install || true

# Run tests
test:
	@echo "Running tests..."
	@uv run python -m pytest tests/ -v -m "not live_gcp"

# Run agent evaluation benchmarks
eval:
	@echo "Running DeployGuard Agent Evaluation benchmark suite..."
	@uv run python -m pytest tests/test_evals.py -v

# Run linters
lint:
	@echo "Running linter (ruff)..."
	@uv run python -m ruff check src/ tests/
	@echo "Running type checker (mypy)..."
	@uv run python -m mypy src/ tests/

# Format code
format:
	@echo "Formatting code (ruff)..."
	@uv run python -m ruff format src/ tests/
	@uv run python -m ruff check src/ tests/ --fix

# Run development server
dev:
	@echo "Starting development server..."
	@uv run python -m uvicorn deployguard.main:app --reload --port 8000

# Full demo runner (interactive with Enter key pauses)
demo:
	@echo "Launching DeployGuard interactive demonstration..."
	@uv run python -m deployguard.demo

# Automated timed demo runner
demo-auto:
	@echo "Launching DeployGuard automated timed demonstration..."
	@uv run python -m deployguard.demo --auto

# Headless fast CI demo runner
demo-ci:
	@echo "Running DeployGuard headless CI demonstration..."
	@uv run python -m deployguard.demo --ci

# Security demonstration scenarios
demo-security:
	@echo "Launching DeployGuard security demonstration suite..."
	@uv run python -m deployguard.demo --scenario security

demo-security-gateway:
	@echo "Launching Agent Gateway denial simulation..."
	@uv run python -m deployguard.demo --scenario gateway

demo-security-injection:
	@echo "Launching Prompt Injection defense simulation..."
	@uv run python -m deployguard.demo --scenario injection

# Clean demo mock state
demo-clean:
	@echo "Cleaning demo state..."
	@uv run python -m deployguard.demo.clean

# Frontend production build
build-web:
	@echo "Building Next.js frontend SPA..."
	@cd web && npm run build

# Full verification suite
verify: format lint test eval build-web
	@echo "All checks passed! ✨"

# Clean up build artifacts and caches
clean: demo-clean
	@echo "Cleaning up..."
	@rm -rf .pytest_cache .ruff_cache .mypy_cache build dist web/out
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@echo "Clean complete."


