module.exports = {
  apps: [
    {
      name: 'ethiopian-maids-web',
      script: 'serve',
      args: '-s apps/web/dist -l 3000',
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: './apps/web/dist',
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      restart_delay: 4000,
    },
  ],
};
