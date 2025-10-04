module.exports = {
  apps: [{
    name: 'backend',
    script: 'dist/index.js',  // Run the compiled JavaScript file
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    // Error and output log files
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Restart policy
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};