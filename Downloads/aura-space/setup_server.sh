#!/bin/bash

# Configuration
SERVER="u2765-zxayjg27hylk@ssh.sirikant19.sg-host.com"
PORT="18765"
APP_NAME="ai-theme-assistant"
APP_DIR="~/ai-theme-assistant"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting server setup...${NC}"

# 1. Create app directory
echo -e "\n${YELLOW}1. Creating app directory...${NC}"
ssh -p $PORT $SERVER "mkdir -p $APP_DIR"

# 2. Install Node.js using nvm
echo -e "\n${YELLOW}2. Installing Node.js...${NC}"
ssh -p $PORT $SERVER "
    # Install nvm if not exists
    if [ ! -d \"\$HOME/.nvm\" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR=\"\$HOME/.nvm"
        [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh"
    fi
    
    # Source nvm
    export NVM_DIR=\"\$HOME/.nvm"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh"
    
    # Install Node.js 18
    nvm install 18
    nvm use 18
    
    # Verify installation
    echo -e "\n${GREEN}✓ Node.js version:${NC} $(node -v)"
    echo -e "${GREEN}✓ npm version:${NC} $(npm -v)"
"

# 3. Install PM2
echo -e "\n${YELLOW}3. Installing PM2...${NC}"
ssh -p $PORT $SERVER "
    export NVM_DIR=\"\$HOME/.nvm"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh"
    npm install -g pm2
    pm2 install pm2-logrotate
"

# 4. Create ecosystem.config.js
echo -e "\n${YELLOW}4. Creating PM2 configuration...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: "$APP_NAME",
    script: "npm",
    args: "start",
    cwd: "$APP_DIR",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Upload the config file
scp -P $PORT ecosystem.config.js $SERVER:$APP_DIR/
rm ecosystem.config.js

# 5. Create Nginx configuration
echo -e "\n${YELLOW}5. Setting up Nginx...${NC}"
cat > nginx-$APP_NAME.conf << EOF
server {
    listen 80;
    server_name sirikant19.sg-host.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Upload Nginx config
echo -e "${YELLOW}Uploading Nginx configuration...${NC}"
scp -P $PORT nginx-$APP_NAME.conf $SERVER:~/nginx-$APP_NAME.conf
rm nginx-$APP_NAME.conf

# 6. Final setup instructions
echo -e "\n${GREEN}✅ Server setup completed!${NC}"
echo -e "\nNext steps:"
echo "1. Deploy your application files to $APP_DIR"
echo "2. Run 'cd $APP_DIR && npm install' to install dependencies"
echo "3. Start the application with 'pm2 start ecosystem.config.js'"
echo "4. Set up Nginx with the provided configuration"
echo -e "\nTo deploy your application, you can use the deploy.sh script"

# Make the script executable
chmod +x setup_server.sh

# Create a simple deployment script
echo -e "\n${YELLOW}Creating deployment script...${NC}"
cat > deploy.sh << 'EOF'
#!/bin/bash

# Configuration
SERVER="u2765-zxayjg27hylk@ssh.sirikant19.sg-host.com"
PORT="18765"
APP_NAME="ai-theme-assistant"
APP_DIR="ai-theme-assistant"
LOCAL_DIR="."

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
git pull origin main

# 2. Install dependencies
echo -e "\n${YELLOW}2. Installing dependencies...${NC}"
npm ci

# 3. Build the application
echo -e "\n${YELLOW}3. Building application...${NC}"
npm run build

# 4. Sync files to server
echo -e "\n${YELLOW}4. Uploading files to server...${NC}"
rsync -avz -e "ssh -p $PORT" --exclude='node_modules' --exclude='.git' $LOCAL_DIR/ $SERVER:$APP_DIR/

# 5. Restart the application
echo -e "\n${YELLOW}5. Restarting application...${NC}"
ssh -p $PORT $SERVER "
    cd $APP_DIR
    export NVM_DIR=\"\$HOME/.nvm"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh"
    npm ci --production
    pm2 restart $APP_NAME
"

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "\nYour application should now be live at: https://sirikant19.sg-host.com"
EOF

# Make the deployment script executable
chmod +x deploy.sh

echo -e "\n${GREEN}✅ Setup completed!${NC}"
echo -e "\nYou can now deploy your application using: ${YELLOW}./deploy.sh${NC}"
echo -e "For more options, run: ${YELLOW}./deploy.sh --help${NC}"
