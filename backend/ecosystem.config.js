module.exports = {
  apps: [{
    name: 'koop-backend',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    env_file: '.env.production',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 1000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
} 