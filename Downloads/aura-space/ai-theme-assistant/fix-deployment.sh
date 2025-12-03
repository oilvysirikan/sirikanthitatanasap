#!/bin/bash

# Configuration
SERVER="u2765-zxayjg27hylk@ssh.sirikant19.sg-host.com"
PORT="18765"
REMOTE_DIR="/home/u2765-zxayjg27hylk/www/sirikant19.sg-host.com/public_html/ai-theme-assistant"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Starting deployment fix script...${NC}"

# Function to run commands on remote server
run_remote() {
  echo -e "${YELLOW}🌐 $1${NC}"
  ssh -p $PORT $SERVER "cd $REMOTE_DIR && $2"
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: $1 failed${NC}"
    exit 1
  fi
}

# 1. Check if server is reachable
echo -e "${YELLOW}🔌 Testing server connection...${NC}"
ssh -p $PORT -q $SERVER exit
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error: Could not connect to the server${NC}"
  exit 1
fi

# 2. Check if directory exists
run_remote "Checking remote directory..." "[ -d . ] || { echo 'Directory does not exist'; exit 1; }"

# 3. Check disk space
echo -e "${YELLOW}💾 Checking disk space...${NC}"
ssh -p $PORT $SERVER "df -h ."

# 4. Install dependencies
run_remote "Installing dependencies..." "npm install --production"

# 5. Build the application
run_remote "Building application..." "npm run build"

# 6. Check if build was successful
run_remote "Verifying build..." "[ -d build ] || { echo 'Build directory not found'; exit 1; }"

# 7. Check if port is in use
echo -e "${YELLOW}🔍 Checking port 3000...${NC}"
ssh -p $PORT $SERVER "netstat -tulpn | grep :3000 || echo 'Port 3000 is available'"

# 8. Restart PM2
run_remote "Restarting PM2..." "\
  pm2 delete ai-theme-assistant 2>/dev/null || true && \
  pm2 start ecosystem.config.js && \
  pm2 save"

# 9. Display status and logs
echo -e "${YELLOW}📊 Application status:${NC}"
ssh -p $PORT $SERVER "pm2 status"

echo -e "${YELLOW}📝 Recent logs:${NC}"
ssh -p $PORT $SERVER "pm2 logs ai-theme-assistant --lines 20 --nostream"

echo -e "${GREEN}✅ Fix deployment script completed successfully!${NC}"
echo -e "${YELLOW}🌐 Your application should now be running at: https://sirikant19.sg-host.com${NC}"
