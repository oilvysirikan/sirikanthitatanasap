#!/bin/bash

# Configuration
SERVER="u2765-zxayjg27hylk@ssh.sirikant19.sg-host.com"
PORT="18765"
REMOTE_DIR="/home/u2765-zxayjg27hylk/www/sirikant19.sg-host.com/public_html/ai-theme-assistant"
LOCAL_DIR="."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting deployment to production...${NC}"

# Step 1: Build the application locally
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Step 2: Sync files to server
echo -e "${YELLOW}📤 Uploading files to server...${NC}"
rsync -avz -e "ssh -p $PORT" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.DS_Store' \
  $LOCAL_DIR/ $SERVER:$REMOTE_DIR/

# Step 3: Install dependencies and restart the application
echo -e "${YELLOW}🚀 Setting up on server...${NC}"
ssh -p $PORT $SERVER "
  cd $REMOTE_DIR && \
  echo '📦 Installing dependencies...' && \
  npm install --production && \
  echo '🔄 Restarting application...' && \
  pm2 delete ai-theme-assistant 2>/dev/null || true && \
  pm2 start ecosystem.config.js && \
  pm2 save && \
  echo '✅ Deployment complete!' && \
  echo '📊 Application status:' && \
  pm2 status ai-theme-assistant
"

echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
