// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-theme-assistant',
    script: 'npm',
    args: 'start',
    cwd: '/home/u2765-zxayjg27hylk/www/sirikant19.sg-host.com/public_html/ai-theme-assistant',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
