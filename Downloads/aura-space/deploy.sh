#!/bin/bash

# Configuration
SERVER="u2765-zxayjg27hylk@ssh.sirikant19.sg-host.com"
PORT="18765"
APP_NAME="ai-theme-assistant"
APP_DIR="ai-theme-assistant"
LOCAL_DIR="."
SSH_OPTS="-p $PORT -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=no"
NODE_VERSION="18"  # Specify your required Node.js version

# Function to handle errors
handle_error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Function to run commands with error handling
run_command() {
    echo -e "${YELLOW}Running: $1${NC}"
    eval "$1" || handle_error "Command failed: $1"
}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to show usage
show_help() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -f, --force     Force deployment even if there are uncommitted changes"
    exit 0
}

# Parse command line arguments
FORCE_DEPLOY=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            ;;
    esac
done

# Check for uncommitted changes
if [ "$FORCE_DEPLOY" = false ]; then
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them before deploying.${NC}"
        echo -e "To force deployment, use: $0 --force"
        exit 1
    fi
fi

echo -e "${YELLOW}🚀 Starting deployment...${NC}"

# 1. Pull latest changes
echo -e "\n${YELLOW}1. Updating code...${NC}"
run_command "git fetch origin main"
run_command "git checkout main"
run_command "git pull origin main"

# 2. Install dependencies
echo -e "\n${YELLOW}2. Installing dependencies...${NC}"
if [ -f "pnpm-lock.yaml" ]; then
    run_command "pnpm install --frozen-lockfile"
elif [ -f "yarn.lock" ]; then
    run_command "yarn install --frozen-lockfile"
else
    run_command "npm ci"
fi

# 3. Build the application (if build script exists)
if grep -q "\"build\"" package.json; then
    echo -e "\n${YELLOW}3. Building application...${NC}"
    if [ -f "pnpm-lock.yaml" ]; then
        run_command "pnpm run build"
    elif [ -f "yarn.lock" ]; then
        run_command "yarn build"
    else
        run_command "npm run build"
    fi
else
    echo -e "\n${YELLOW}3. No build script found, skipping build step...${NC}"
fi

# 4. Sync files to server
echo -e "\n${YELLOW}4. Uploading files to server...${NC}"
run_command "rsync -avz -e 'ssh -p $PORT -o StrictHostKeyChecking=no' \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='logs' \
    --include='package-lock.json' \
    --include='package.json' \
    --include='ecosystem.config.js' \
    --include='build/' \
    --include='public/' \
    --include='app/' \
    --include='server/' \
    --include='shared/' \
    --include='client/' \
    --exclude='*' \
    $LOCAL_DIR/ $SERVER:$APP_DIR/"

# 5. Setup and restart the application
echo -e "\n${YELLOW}5. Setting up and restarting application...${NC}"
run_command "ssh $SSH_OPTS $SERVER 'bash -s' -- '$APP_NAME' '$NODE_VERSION' '$APP_DIR'" << 'ENDSSH'
    # Get parameters
    APP_NAME="$1"
    NODE_VERSION="$2"
    APP_DIR="$3"
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install NVM if not installed
    if [ ! -d "$NVM_DIR" ]; then
        echo "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Install Node.js if not installed or wrong version
    if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "$NODE_VERSION" ]; then
        echo "Installing Node.js v$NODE_VERSION..."
        nvm install $NODE_VERSION
        nvm use $NODE_VERSION
    fi
    
    # Install PM2 globally if not installed
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        npm install -g pm2
    fi
    
    # Go to app directory
    cd "$APP_DIR" || { echo "Failed to change to directory: $APP_DIR"; exit 1; }
    
    # Install production dependencies
    echo "Installing production dependencies..."
    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --production
    elif [ -f "yarn.lock" ]; then
        yarn install --production
    else
        npm ci --only=production
    fi
    
    # Start/Restart the application
    echo "Starting application with PM2..."
    if ! pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        # App is not running, start it
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js --name "$APP_NAME"
        elif [ -f "package.json" ] && [ -n "$(jq -r '.main' package.json 2>/dev/null || echo '')" ]; then
            pm2 start "$(jq -r '.main' package.json)" --name "$APP_NAME"
        else
            echo "No suitable entry point found for PM2. Please create an ecosystem.config.js file."
            exit 1
        fi
    else
        # App is running, restart it
        pm2 restart "$APP_NAME"
    fi
    
    # Save PM2 process list
    echo "Saving PM2 process list..."
    pm2 save
    
    # Set up PM2 startup script if not already set up
    if ! pm2 startup 2>&1 | grep -q "already in daemon"; then
        echo "Setting up PM2 startup..."
        pm2 startup 2>&1 | grep "sudo" | bash
    fi
    
    # Final status
    echo -e "\n${GREEN}✅ Application deployed successfully!${NC}"
    echo -e "\nApplication status:"
    pm2 list
    
    # Ensure PM2 logs are rotated
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
ENDSSH

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "\nYour application should now be live at: https://sirikant19.sg-host.com"
