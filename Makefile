.PHONY: all install test lint format dev clean verify

# Default target
all: verify

# Install dependencies using uv
install:
	@echo "Installing dependencies..."
	@uv venv .venv || true
	@uv pip install -e ".[dev]"

# Run tests
test:
	@echo "Running tests..."
	@.venv/Scripts/python.exe -m pytest tests/ -v

# Run linters
lint:
	@echo "Running linter (ruff)..."
	@.venv/Scripts/python.exe -m ruff check src/ tests/
	@echo "Running type checker (mypy)..."
	@.venv/Scripts/python.exe -m mypy src/ tests/

# Format code
format:
	@echo "Formatting code (ruff)..."
	@.venv/Scripts/python.exe -m ruff format src/ tests/
	@.venv/Scripts/python.exe -m ruff check src/ tests/ --fix

# Run development server
dev:
	@echo "Starting development server..."
	@.venv/Scripts/python.exe -m uvicorn deployguard.main:app --reload --port 8000

# Full verification suite
verify: format lint test
	@echo "All checks passed! ✨"

# Clean up build artifacts and caches
clean:
	@echo "Cleaning up..."
	@if exist .venv rmdir /s /q .venv
	@if exist .pytest_cache rmdir /s /q .pytest_cache
	@if exist .ruff_cache rmdir /s /q .ruff_cache
	@if exist .mypy_cache rmdir /s /q .mypy_cache
	@for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
	@echo "Clean complete."
