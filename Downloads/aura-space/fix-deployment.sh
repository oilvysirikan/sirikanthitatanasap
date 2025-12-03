#!/bin/bash

# Configuration
SERVER_USER="u2765-zxayjg27hylk"
SERVER_HOST="ssh.sirikant19.sg-host.com"
SERVER_PORT="18765"
REMOTE_DIR="~/www/sirikant19.sg-host.com/public_html"
APP_NAME="ai-theme-assistant"
APP_DIR="$REMOTE_DIR/$APP_NAME"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Fixing deployment issues...${NC}"

ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
    # Create the directory if it doesn't exist
    mkdir -p $APP_DIR
    cd $APP_DIR || { echo "Failed to change to directory: $APP_DIR"; exit 1; }
    
    echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
    rm -rf node_modules
    npm install --production
    
    echo -e "\n${YELLOW}🔨 Building application...${NC}"
    npm run build
    
    echo -e "\n${YELLOW}📁 Creating logs directory...${NC}"
    mkdir -p logs
    
    echo -e "\n${YELLOW}🔄 Setting up PM2...${NC}"
    # Install PM2 globally if not installed
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        npm install -g pm2
    fi
    
    # Stop and delete existing process if running
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start the application
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        echo -e "\n${RED}❌ Error: ecosystem.config.js not found in $APP_DIR${NC}"
        echo "Please make sure the file exists and try again."
        exit 1
    fi
    
    # Save PM2 process list
    pm2 save
    
    echo -e "\n${YELLOW}📊 Checking status...${NC}"
    pm2 status
    
    echo -e "\n${YELLOW}📝 Showing recent logs...${NC}"
    pm2 logs ai-theme-assistant --lines 20 --nostream
ENDSSH

echo -e "\n${GREEN}✅ Fix completed!${NC}"
echo -e "Check your application at: https://sirikant19.sg-host.com"
