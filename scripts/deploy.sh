#!/bin/bash

# Quantum Forest Fire Production Deployment Script
# Handles environment setup, configuration validation, and deployment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
VERSION="${VERSION:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Quantum Forest Fire Deployment Script

Usage: $0 [OPTIONS] COMMAND

Commands:
    deploy          Deploy the application
    update          Update existing deployment
    rollback        Rollback to previous version
    scale           Scale services
    status          Check deployment status
    logs            View service logs
    backup          Create backup
    restore         Restore from backup
    cleanup         Clean up resources

Options:
    -e, --env ENV       Deployment environment (development|staging|production)
    -v, --version VER   Version to deploy (default: latest)
    -r, --registry REG  Docker registry URL
    -h, --help          Show this help message

Examples:
    $0 deploy
    $0 -e staging deploy
    $0 -v v1.2.3 update
    $0 scale --replicas 5
    $0 rollback --to v1.2.2
EOF
}

# Prerequisites check
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    for tool in docker docker-compose kubectl helm; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install the missing tools and try again"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Environment validation
validate_environment() {
    log_info "Validating environment configuration..."
    
    local env_file="$PROJECT_DIR/.env.$DEPLOYMENT_ENV"
    
    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        exit 1
    fi
    
    # Source environment variables
    set -a
    source "$env_file"
    set +a
    
    # Validate required variables
    local required_vars=(
        "SECRET_KEY"
        "DB_PASSWORD"
        "CLASSIQ_TOKEN"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Production-specific validations
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        if [ "$DEBUG" = "true" ]; then
            log_error "DEBUG must be false in production"
            exit 1
        fi
        
        if [ "$SECRET_KEY" = "dev-secret-key" ]; then
            log_error "SECRET_KEY must be changed from default in production"
            exit 1
        fi
    fi
    
    log_success "Environment validation passed"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Backend image
    log_info "Building backend image..."
    docker build -f backend/Dockerfile.prod -t quantum-fire-backend:$VERSION backend/
    
    # Frontend image
    log_info "Building frontend image..."
    docker build -f frontend/Dockerfile.prod -t quantum-fire-frontend:$VERSION frontend/
    
    # Tag for registry if specified
    if [ -n "$DOCKER_REGISTRY" ]; then
        docker tag quantum-fire-backend:$VERSION $DOCKER_REGISTRY/quantum-fire-backend:$VERSION
        docker tag quantum-fire-frontend:$VERSION $DOCKER_REGISTRY/quantum-fire-frontend:$VERSION
    fi
    
    log_success "Docker images built successfully"
}

# Push images to registry
push_images() {
    if [ -z "$DOCKER_REGISTRY" ]; then
        log_warning "No registry specified, skipping image push"
        return
    fi
    
    log_info "Pushing images to registry..."
    
    docker push $DOCKER_REGISTRY/quantum-fire-backend:$VERSION
    docker push $DOCKER_REGISTRY/quantum-fire-frontend:$VERSION
    
    log_success "Images pushed to registry"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    log_info "Deploying with Docker Compose..."
    
    # Create secrets directory if it doesn't exist
    mkdir -p secrets
    
    # Write secrets to files
    echo "$SECRET_KEY" > secrets/secret_key.txt
    echo "$DB_PASSWORD" > secrets/db_password.txt
    echo "$CLASSIQ_TOKEN" > secrets/classiq_token.txt
    
    # Deploy with docker-compose
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Application deployed with Docker Compose"
}

# Deploy with Kubernetes
deploy_kubernetes() {
    log_info "Deploying with Kubernetes..."
    
    # Apply configurations
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/configmaps.yaml
    kubectl apply -f k8s/persistent-volumes.yaml
    kubectl apply -f k8s/database.yaml
    kubectl apply -f k8s/redis.yaml
    kubectl apply -f k8s/backend.yaml
    kubectl apply -f k8s/frontend.yaml
    kubectl apply -f k8s/ingress.yaml
    kubectl apply -f k8s/monitoring.yaml
    
    # Wait for deployment
    kubectl wait --for=condition=available --timeout=300s deployment/quantum-fire-backend
    kubectl wait --for=condition=available --timeout=300s deployment/quantum-fire-frontend
    
    log_success "Application deployed to Kubernetes"
}

# Scale services
scale_services() {
    local replicas="${1:-3}"
    
    log_info "Scaling services to $replicas replicas..."
    
    if command -v kubectl &> /dev/null && kubectl cluster-info &> /dev/null; then
        kubectl scale deployment quantum-fire-backend --replicas=$replicas
        kubectl scale deployment quantum-fire-frontend --replicas=$replicas
    else
        docker-compose -f docker-compose.prod.yml up -d --scale quantum-fire-api=$replicas --scale quantum-fire-frontend=$replicas
    fi
    
    log_success "Services scaled to $replicas replicas"
}

# Check deployment status
check_status() {
    log_info "Checking deployment status..."
    
    if command -v kubectl &> /dev/null && kubectl cluster-info &> /dev/null; then
        echo "Kubernetes Deployment Status:"
        kubectl get pods -l app=quantum-fire
        kubectl get services
        kubectl get ingress
    else
        echo "Docker Compose Status:"
        docker-compose -f docker-compose.prod.yml ps
    fi
    
    # Health check
    log_info "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8000/health &> /dev/null; then
            log_success "Backend health check passed"
            break
        fi
        
        log_info "Attempt $attempt/$max_attempts: Waiting for backend to be ready..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Backend health check failed after $max_attempts attempts"
        exit 1
    fi
}

# View logs
view_logs() {
    local service="${1:-all}"
    
    if command -v kubectl &> /dev/null && kubectl cluster-info &> /dev/null; then
        if [ "$service" = "all" ]; then
            kubectl logs -l app=quantum-fire --tail=100 -f
        else
            kubectl logs -l app=quantum-fire,component=$service --tail=100 -f
        fi
    else
        if [ "$service" = "all" ]; then
            docker-compose -f docker-compose.prod.yml logs -f --tail=100
        else
            docker-compose -f docker-compose.prod.yml logs -f --tail=100 $service
        fi
    fi
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Database backup
    if command -v kubectl &> /dev/null && kubectl cluster-info &> /dev/null; then
        kubectl exec -i deployment/postgres -- pg_dump -U quantumfire quantumfire_prod > "$backup_dir/database.sql"
    else
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U quantumfire quantumfire_prod > "$backup_dir/database.sql"
    fi
    
    # Data files backup
    if [ -d "data" ]; then
        tar -czf "$backup_dir/data.tar.gz" data/
    fi
    
    # Configuration backup
    cp -r k8s/ "$backup_dir/" 2>/dev/null || true
    cp docker-compose.prod.yml "$backup_dir/" 2>/dev/null || true
    cp .env.* "$backup_dir/" 2>/dev/null || true
    
    log_success "Backup created in $backup_dir"
}

# Restore from backup
restore_backup() {
    local backup_dir="${1:-}"
    
    if [ -z "$backup_dir" ] || [ ! -d "$backup_dir" ]; then
        log_error "Please specify a valid backup directory"
        exit 1
    fi
    
    log_info "Restoring from backup: $backup_dir"
    
    # Database restore
    if [ -f "$backup_dir/database.sql" ]; then
        if command -v kubectl &> /dev/null && kubectl cluster-info &> /dev/null; then
            kubectl exec -i deployment/postgres -- psql -U quantumfire -d quantumfire_prod < "$backup_dir/database.sql"
        else
            docker-compose -f docker-compose.prod.yml exec -T postgres psql -U quantumfire -d quantumfire_prod < "$backup_dir/database.sql"
        fi
    fi
    
    # Data files restore
    if [ -f "$backup_dir/data.tar.gz" ]; then
        tar -xzf "$backup_dir/data.tar.gz"
    fi
    
    log_success "Restore completed"
}

# Cleanup resources
cleanup() {
    log_info "Cleaning up resources..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    log_success "Cleanup completed"
}

# Rollback deployment
rollback() {
    local target_version="${1:-}"
    
    if [ -z "$target_version" ]; then
        log_error "Please specify target version for rollback"
        exit 1
    fi
    
    log_info "Rolling back to version: $target_version"
    
    if command -v kubectl &> /dev/null && kubectl cluster-info &> /dev/null; then
        kubectl set image deployment/quantum-fire-backend app=$DOCKER_REGISTRY/quantum-fire-backend:$target_version
        kubectl set image deployment/quantum-fire-frontend app=$DOCKER_REGISTRY/quantum-fire-frontend:$target_version
        kubectl rollout status deployment/quantum-fire-backend
        kubectl rollout status deployment/quantum-fire-frontend
    else
        export VERSION=$target_version
        docker-compose -f docker-compose.prod.yml up -d
    fi
    
    log_success "Rollback completed"
}

# Main function
main() {
    local command=""
    local replicas=""
    local target_version=""
    local service=""
    local backup_dir=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                DEPLOYMENT_ENV="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -r|--registry)
                DOCKER_REGISTRY="$2"
                shift 2
                ;;
            --replicas)
                replicas="$2"
                shift 2
                ;;
            --to)
                target_version="$2"
                shift 2
                ;;
            --service)
                service="$2"
                shift 2
                ;;
            --backup-dir)
                backup_dir="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            deploy|update|rollback|scale|status|logs|backup|restore|cleanup)
                command="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    if [ -z "$command" ]; then
        log_error "No command specified"
        show_help
        exit 1
    fi
    
    # Run prerequisites check for most commands
    if [[ "$command" != "help" && "$command" != "logs" ]]; then
        check_prerequisites
    fi
    
    # Execute command
    case $command in
        deploy)
            validate_environment
            build_images
            push_images
            if command -v kubectl &> /dev/null && kubectl cluster-info &> /dev/null; then
                deploy_kubernetes
            else
                deploy_docker_compose
            fi
            check_status
            ;;
        update)
            validate_environment
            build_images
            push_images
            if command -v kubectl &> /dev/null && kubectl cluster-info &> /dev/null; then
                deploy_kubernetes
            else
                deploy_docker_compose
            fi
            check_status
            ;;
        rollback)
            rollback "$target_version"
            ;;
        scale)
            scale_services "$replicas"
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs "$service"
            ;;
        backup)
            create_backup
            ;;
        restore)
            restore_backup "$backup_dir"
            ;;
        cleanup)
            cleanup
            ;;
        *)
            log_error "Unknown command: $command"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
