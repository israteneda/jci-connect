# JCI Connect Backend - Docker Management Makefile

# Variables
IMAGE_NAME = jci-connect-backend
CONTAINER_NAME = jci-connect-backend
PORT = 8001
COMPOSE_FILE = docker-compose.yml

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

.PHONY: help build run stop clean logs shell test health dev prod status restart

# Default target
help: ## Show this help message
	@echo "$(BLUE)JCI Connect Backend - Docker Management$(NC)"
	@echo "$(BLUE)=====================================$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make build     # Build the Docker image"
	@echo "  make run       # Run the container"
	@echo "  make logs      # View container logs"
	@echo "  make shell     # Access container shell"

# Docker Commands
build: ## Build the Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t $(IMAGE_NAME) .
	@echo "$(GREEN) Image built successfully!$(NC)"

build-no-cache: ## Build the Docker image without cache
	@echo "$(BLUE)Building Docker image (no cache)...$(NC)"
	docker build --no-cache -t $(IMAGE_NAME) .
	@echo "$(GREEN) Image built successfully!$(NC)"

run: ## Run the container
	@echo "$(BLUE)Starting container...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED) .env file not found! Please copy env.example to .env and configure it.$(NC)"; \
		exit 1; \
	fi
	docker run -d \
		--name $(CONTAINER_NAME) \
		--env-file .env \
		-p $(PORT):8000 \
		--restart unless-stopped \
		$(IMAGE_NAME)
	@echo "$(GREEN) Container started successfully!$(NC)"
	@echo "$(YELLOW) API available at: http://localhost:$(PORT)$(NC)"
	@echo "$(YELLOW) Docs available at: http://localhost:$(PORT)/docs$(NC)"

run-interactive: ## Run the container in interactive mode
	@echo "$(BLUE)Starting container in interactive mode...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED) .env file not found! Please copy env.example to .env and configure it.$(NC)"; \
		exit 1; \
	fi
	docker run -it \
		--name $(CONTAINER_NAME)-interactive \
		--env-file .env \
		-p $(PORT):8000 \
		$(IMAGE_NAME)

stop: ## Stop the container
	@echo "$(BLUE)Stopping container...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || echo "$(YELLOW)Container not running$(NC)"
	@echo "$(GREEN) Container stopped!$(NC)"

clean: ## Remove container and image
	@echo "$(BLUE)Cleaning up...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo "$(GREEN) Cleanup completed!$(NC)"

# Docker Compose Commands
up: ## Start services with docker-compose
	@echo "$(BLUE)Starting services with docker-compose...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED) .env file not found! Please copy env.example to .env and configure it.$(NC)"; \
		exit 1; \
	fi
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN) Services started successfully!$(NC)"
	@echo "$(YELLOW) API available at: http://localhost:$(PORT)$(NC)"
	@echo "$(YELLOW) Docs available at: http://localhost:$(PORT)/docs$(NC)"

down: ## Stop services with docker-compose
	@echo "$(BLUE)Stopping services with docker-compose...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN) Services stopped!$(NC)"

restart: ## Restart services with docker-compose
	@echo "$(BLUE)Restarting services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) restart
	@echo "$(GREEN) Services restarted!$(NC)"

# Utility Commands
logs: ## View container logs
	@echo "$(BLUE)Viewing container logs...$(NC)"
	@docker logs -f $(CONTAINER_NAME) 2>/dev/null || docker-compose -f $(COMPOSE_FILE) logs -f

logs-tail: ## View last 100 lines of logs
	@echo "$(BLUE)Viewing last 100 lines of logs...$(NC)"
	@docker logs --tail 100 $(CONTAINER_NAME) 2>/dev/null || docker-compose -f $(COMPOSE_FILE) logs --tail 100

shell: ## Access container shell
	@echo "$(BLUE)Accessing container shell...$(NC)"
	@docker exec -it $(CONTAINER_NAME) /bin/bash 2>/dev/null || docker-compose -f $(COMPOSE_FILE) exec jci-connect-backend /bin/bash

status: ## Show container status
	@echo "$(BLUE)Container Status:$(NC)"
	@docker ps -a --filter name=$(CONTAINER_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || \
	docker-compose -f $(COMPOSE_FILE) ps

health: ## Check API health
	@echo "$(BLUE)Checking API health...$(NC)"
	@curl -s http://localhost:$(PORT)/health | python -m json.tool 2>/dev/null || \
	echo "$(RED) API not responding or not running$(NC)"

# Development Commands
dev: ## Run in development mode (with hot reload)
	@echo "$(BLUE)Starting development server...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED) .env file not found! Please copy env.example to .env and configure it.$(NC)"; \
		exit 1; \
	fi
	docker run -it \
		--name $(CONTAINER_NAME)-dev \
		--env-file .env \
		-p $(PORT):8000 \
		-v $(PWD):/app \
		$(IMAGE_NAME) \
		uvicorn main:app --host 0.0.0.0 --port 8000 --reload

prod: ## Run in production mode
	@echo "$(BLUE)Starting production server...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED) .env file not found! Please copy env.example to .env and configure it.$(NC)"; \
		exit 1; \
	fi
	docker run -d \
		--name $(CONTAINER_NAME)-prod \
		--env-file .env \
		-p $(PORT):8000 \
		--restart unless-stopped \
		$(IMAGE_NAME) \
		uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Testing Commands
test: ## Run tests in container
	@echo "$(BLUE)Running tests...$(NC)"
	@docker run --rm \
		--env-file .env \
		$(IMAGE_NAME) \
		python -m pytest

# Setup Commands
setup: ## Initial setup (copy env file and build image)
	@echo "$(BLUE)Setting up JCI Connect Backend...$(NC)"
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "$(YELLOW) Created .env file from template. Please configure your settings.$(NC)"; \
	else \
		echo "$(GREEN) .env file already exists$(NC)"; \
	fi
	@make build
	@echo "$(GREEN) Setup completed!$(NC)"
	@echo "$(YELLOW) Next steps:$(NC)"
	@echo "  1. Edit .env file with your configuration"
	@echo "  2. Run 'make run' to start the container"
	@echo "  3. Visit http://localhost:$(PORT)/docs for API documentation"

# Monitoring Commands
monitor: ## Monitor container resources
	@echo "$(BLUE)Monitoring container resources...$(NC)"
	@docker stats $(CONTAINER_NAME) 2>/dev/null || echo "$(RED)Container not running$(NC)"

# Backup Commands
backup-logs: ## Backup container logs
	@echo "$(BLUE)Backing up logs...$(NC)"
	@mkdir -p backups
	@docker logs $(CONTAINER_NAME) > backups/logs-$(shell date +%Y%m%d-%H%M%S).txt 2>/dev/null || \
	echo "$(RED)Container not running or no logs available$(NC)"
	@echo "$(GREEN) Logs backed up to backups/ directory$(NC)"

# Quick Commands
quick-start: setup run ## Quick start (setup + run)
	@echo "$(GREEN) JCI Connect Backend is ready!$(NC)"

quick-stop: stop clean ## Quick stop (stop + clean)
	@echo "$(GREEN) JCI Connect Backend stopped and cleaned!$(NC)"
