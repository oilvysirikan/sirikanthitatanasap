#!/bin/bash

# 🚀 Deploy Script for CRM Hybrid Architecture
# Deploy Backend to Railway + Frontend to SiteGround

echo "
╔═══════════════════════════════════════════════════════════╗
║                🚀 CRM Deployment Script                  ║
║           SiteGround (Frontend) + Railway (Backend)      ║
╚═══════════════════════════════════════════════════════════╝
"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - แก้ไขตามการตั้งค่าจริง
SITEGROUND_HOST="your_domain.com"
SITEGROUND_USER="your_cpanel_username"
SITEGROUND_PATH="/home/$SITEGROUND_USER/public_html/crm"
GITHUB_REPO="https://github.com/your-username/crm-backend.git"

# Functions
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_step "Checking requirements..."
    
    command -v git >/dev/null 2>&1 || { print_error "Git is required but not installed. Aborting."; exit 1; }
    command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
    command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
    
    print_success "All requirements satisfied"
}

# Deploy Backend to Railway
deploy_backend() {
    print_step "Deploying Backend to Railway..."
    
    # Check if in backend directory
    if [ ! -f "server.js" ]; then
        print_error "server.js not found. Make sure you're in the backend directory"
        exit 1
    fi
    
    # Check if git repo is initialized
    if [ ! -d ".git" ]; then
        print_step "Initializing git repository..."
        git init
        git add .
        git commit -m "Initial commit for Railway deployment"
    fi
    
    # Check if remote exists
    if ! git remote get-url origin >/dev/null 2>&1; then
        print_warning "Git remote 'origin' not found"
        echo -e "${YELLOW}Please add your GitHub repository:${NC}"
        echo "git remote add origin $GITHUB_REPO"
        echo "Then run this script again"
        exit 1
    fi
    
    # Push to GitHub (Railway will auto-deploy)
    print_step "Pushing to GitHub..."
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || true
    git push origin main
    
    print_success "Backend pushed to GitHub"
    print_step "Railway will auto-deploy from GitHub"
    print_step "Check deployment status at: https://railway.app/dashboard"
}

# Build Frontend
build_frontend() {
    print_step "Building Frontend..."
    
    # Go to frontend directory
    cd ../frontend/admin || {
        print_error "Frontend directory not found at ../frontend/admin"
        exit 1
    }
    
    # Install dependencies
    print_step "Installing frontend dependencies..."
    npm install
    
    # Build production version
    print_step "Building production version..."
    if command -v gulp >/dev/null 2>&1; then
        gulp build
    elif [ -f "package.json" ] && grep -q "build" package.json; then
        npm run build
    else
        print_warning "No build command found. Using source files directly."
        mkdir -p dist
        cp -r src/* dist/
    fi
    
    print_success "Frontend build completed"
}

# Deploy Frontend to SiteGround
deploy_frontend() {
    print_step "Deploying Frontend to SiteGround..."
    
    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        print_error "dist directory not found. Build failed?"
        exit 1
    fi
    
    # Deploy via SCP (requires SSH access)
    print_step "Uploading files via SCP..."
    echo -e "${YELLOW}Enter SiteGround password when prompted${NC}"
    
    # Upload dist files
    scp -r dist/* $SITEGROUND_USER@$SITEGROUND_HOST:$SITEGROUND_PATH/
    
    # Upload API proxy
    scp ../backend/api-proxy.php $SITEGROUND_USER@$SITEGROUND_HOST:$SITEGROUND_PATH/api-proxy/index.php
    
    print_success "Frontend deployed to SiteGround"
}

# Create necessary files on SiteGround
setup_siteground_files() {
    print_step "Setting up SiteGround configuration files..."
    
    # Create .htaccess for main directory
    cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /crm/
    
    # API Proxy - Forward to PHP proxy
    RewriteRule ^api-proxy/(.*)$ api-proxy/index.php [QSA,L]
    
    # SPA Routing - Frontend
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/crm/api-proxy/
    RewriteRule . /crm/index.html [L]
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Protect sensitive files
<FilesMatch "\.(env|log|sql|md)$">
    Order allow,deny
    Deny from all
</FilesMatch>
EOF

    # Create .htaccess for api-proxy directory
    mkdir -p api-proxy
    cat > api-proxy/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /crm/api-proxy/
    
    # Forward all requests to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
EOF

    print_success "Configuration files created"
}

# Update API configuration
update_api_config() {
    print_step "Updating API configuration..."
    
    # Update api-client.js to use proxy
    if [ -f "dist/assets/js/api/api-client.js" ]; then
        sed -i.bak 's|const API_BASE_URL = .*|const API_BASE_URL = "/api-proxy/api";|' dist/assets/js/api/api-client.js
        print_success "API client updated to use proxy"
    else
        print_warning "api-client.js not found, please update manually"
    fi
}

# Main execution
main() {
    print_step "Starting CRM deployment process..."
    
    # Check current directory
    if [ ! -f "server.js" ] && [ ! -f "../backend/server.js" ]; then
        print_error "Please run this script from the backend directory or project root"
        exit 1
    fi
    
    # Go to backend directory if not already there
    if [ ! -f "server.js" ]; then
        cd backend
    fi
    
    check_requirements
    
    # Deploy backend
    deploy_backend
    
    # Build and deploy frontend
    build_frontend
    setup_siteground_files
    update_api_config
    deploy_frontend
    
    echo "
╔═══════════════════════════════════════════════════════════╗
║                    🎉 Deployment Complete!              ║
╠═══════════════════════════════════════════════════════════╣
║                                                          ║
║  🌐 Frontend: https://crm.o2odesign.com                 ║
║  🔌 API Proxy: https://crm.o2odesign.com/api-proxy/api  ║
║  🖥️  Railway Backend: Check Railway dashboard           ║
║                                                          ║
║  📋 Next Steps:                                          ║
║  1. Verify Railway deployment status                     ║
║  2. Update Railway backend URL in api-proxy.php         ║
║  3. Test API endpoints                                   ║
║  4. Test frontend functionality                          ║
║  5. Setup monitoring & backups                           ║
║                                                          ║
╚═══════════════════════════════════════════════════════════╝
    "
    
    print_success "Deployment completed successfully!"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT

# Run main function
main "$@"
