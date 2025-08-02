#!/bin/bash

# LibreChat First Admin User Creation Script
# This script creates the first admin user for a LibreChat installation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_EMAIL="admin@prometheusags.ai"
DEFAULT_NAME="Admin User"
DEFAULT_USERNAME="admin"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Create the first admin user for LibreChat"
    echo ""
    echo "Options:"
    echo "  -e, --email EMAIL        Email address (default: $DEFAULT_EMAIL)"
    echo "  -n, --name NAME          Display name (default: '$DEFAULT_NAME')"
    echo "  -u, --username USERNAME  Username (default: $DEFAULT_USERNAME)"
    echo "  -p, --password PASSWORD  Password (if not provided, one will be generated)"
    echo "  --no-verify             Don't mark email as verified"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Use all defaults"
    echo "  $0 -e admin@example.com               # Custom email"
    echo "  $0 -e admin@example.com -n 'John Doe' -u john"
    echo ""
}

# Function to check if Docker containers are running
check_docker() {
    print_info "Checking if LibreChat containers are running..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker compose ps | grep -q "api.*Up"; then
        print_error "LibreChat API container is not running"
        print_info "Please start LibreChat with: docker compose up -d"
        exit 1
    fi
    
    print_success "Docker containers are running"
}

# Function to create the user
create_user() {
    local email="$1"
    local name="$2"
    local username="$3"
    local password="$4"
    local email_verified="$5"
    
    print_info "Creating user with the following details:"
    echo "  Email: $email"
    echo "  Name: $name"
    echo "  Username: $username"
    echo "  Email Verified: $email_verified"
    
    # Build the command
    local cmd="docker compose exec -T api npm run create-user"
    cmd="$cmd \"$email\" \"$name\" \"$username\""
    
    # Add password if provided
    if [[ -n "$password" ]]; then
        print_warning "Password provided via command line (not recommended for production)"
        cmd="$cmd \"$password\""
    fi
    
    # Add email verification flag
    cmd="$cmd -- --email-verified=$email_verified"
    
    print_info "Executing: $cmd"
    echo ""
    
    # Execute the command
    if eval "$cmd"; then
        print_success "User created successfully!"
        echo ""
        print_info "Next steps:"
        echo "  1. Access your LibreChat installation"
        echo "  2. Log in with the created credentials"
        echo "  3. Configure admin role if needed"
        echo "  4. Set up AI model configurations"
    else
        print_error "Failed to create user"
        exit 1
    fi
}

# Parse command line arguments
EMAIL="$DEFAULT_EMAIL"
NAME="$DEFAULT_NAME"
USERNAME="$DEFAULT_USERNAME"
PASSWORD=""
EMAIL_VERIFIED="true"

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -n|--name)
            NAME="$2"
            shift 2
            ;;
        -u|--username)
            USERNAME="$2"
            shift 2
            ;;
        -p|--password)
            PASSWORD="$2"
            shift 2
            ;;
        --no-verify)
            EMAIL_VERIFIED="false"
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate email format
if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    print_error "Invalid email format: $EMAIL"
    exit 1
fi

# Main execution
print_info "LibreChat First Admin User Creation Script"
echo "=========================================="
echo ""

# Check prerequisites
check_docker

echo ""

# Create the user
create_user "$EMAIL" "$NAME" "$USERNAME" "$PASSWORD" "$EMAIL_VERIFIED"
