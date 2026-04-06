.PHONY: up down health logs ps setup seed backup clean

# Load .env if it exists
ifneq (,$(wildcard ./.env))
	include .env
	export
endif

COMPOSE := docker compose

## ── Lifecycle ─────────────────────────────────

up: ## Start all enabled services
	$(COMPOSE) --profile essential --profile core --profile ops up -d
	@echo "\n✓ Services starting. Run 'make health' to check status."

up-all: ## Start everything including growth modules
	$(COMPOSE) --profile essential --profile core --profile ops --profile growth up -d

down: ## Stop all services (preserves data)
	$(COMPOSE) --profile essential --profile core --profile ops --profile growth down

restart: down up ## Restart all services

destroy: ## Stop and remove all data (DESTRUCTIVE)
	@echo "⚠ This will delete ALL data volumes. Press Ctrl+C to cancel."
	@sleep 3
	$(COMPOSE) --profile essential --profile core --profile ops --profile growth down -v

## ── Monitoring ────────────────────────────────

health: ## Check health of all running services
	@./scripts/health-check.sh

ps: ## Show running services
	$(COMPOSE) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

logs: ## Tail logs for all services
	$(COMPOSE) logs -f --tail=50

logs-%: ## Tail logs for specific service (e.g., make logs-logto)
	$(COMPOSE) logs -f --tail=100 $*

## ── Setup ─────────────────────────────────────

setup: ## First-time setup: create DBs, run migrations
	@./scripts/setup.sh

seed: ## Seed sample data
	@./scripts/seed.sh

backup: ## Backup all databases
	@./scripts/backup.sh

## ── Help ──────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_%-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
