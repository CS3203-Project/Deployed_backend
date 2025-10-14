module.exports = {
  apps: [{
    name: 'backend',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }, {
    name: 'backend-dev',
    script: 'node_modules/.bin/nodemon',
    args: '--exec tsx index.ts',
    instances: 1,
    autorestart: true,
    watch: ['src', 'index.ts'],
    ignore_watch: ['node_modules', 'dist', 'logs'],
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
};