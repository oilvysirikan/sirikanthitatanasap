#!/bin/bash

# Configuration
SERVER_USER="u2765-zxayjg27hylk"
SERVER_HOST="ssh.sirikant19.sg-host.com"
SERVER_PORT="18765"
APP_DIR="/home/u2765-zxayjg27hylk/www/sirikant19.sg-host.com/public_html/ai-theme-assistant"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Fixing deployment issues...${NC}"

ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
    cd /home/u2765-zxayjg27hylk/www/sirikant19.sg-host.com/public_html/ai-theme-assistant
    
    echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
    rm -rf node_modules
    npm install --production
    
    echo -e "\n${YELLOW}🔨 Building application...${NC}"
    npm run build
    
    echo -e "\n${YELLOW}📁 Creating logs directory...${NC}"
    mkdir -p logs
    
    echo -e "\n${YELLOW}🔄 Restarting PM2...${NC}"
    pm2 delete ai-theme-assistant 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    
    echo -e "\n${YELLOW}📊 Checking status...${NC}"
    pm2 status
    
    echo -e "\n${YELLOW}📝 Showing recent logs...${NC}"
    pm2 logs ai-theme-assistant --lines 20 --nostream
ENDSSH

echo -e "\n${GREEN}✅ Fix completed!${NC}"
echo -e "Check your application at: https://sirikant19.sg-host.com"
