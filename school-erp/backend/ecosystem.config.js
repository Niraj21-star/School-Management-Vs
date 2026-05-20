module.exports = {
  apps: [
    {
      name: 'school-erp-backend',
      script: 'server.js',
      instances: 'max',       // Utilize all available CPU cores
      exec_mode: 'cluster',   // Cluster mode (load balancer)
      watch: false,           // Do not watch files in production
      max_memory_restart: '1G', // Restart if RAM exceeds 1GB
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
