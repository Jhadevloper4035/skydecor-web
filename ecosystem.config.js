module.exports = {
  apps: [{
    name: 'skydecor',
    script: './app.js',  // or your main file (index.js, server.js, etc.)
    instances: "max",
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/skydecor/app/logs/err.log',
    out_file: '/var/www/skydecor/app/logs/out.log',
    log_file: '/var/www/skydecor/app/logs/combined.log',
    time: true
  }]
};
