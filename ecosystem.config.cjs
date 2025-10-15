module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'backend-dev',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      autorestart: true,
      watch: ['src', 'index.ts'],
      ignore_watch: ['node_modules', 'dist', 'logs'],
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    }
  ]
};