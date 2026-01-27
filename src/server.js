require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start server after database connection
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 Server URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`\n⏰ Started at: ${new Date().toLocaleString()}\n`);

      // Initialize Cron Jobs for Alerts
      const cron = require('node-cron');
      const { processScheduledAlerts } = require('./utils/alertService');

      // Daily Digest at 9:00 AM
      cron.schedule('0 9 * * *', () => {
        processScheduledAlerts('daily');
      });

      // Weekly Digest on Monday 10:00 AM
      cron.schedule('0 10 * * 1', () => {
        processScheduledAlerts('weekly');
      });

      console.log('⏰ Alert cron jobs initialized');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`❌ Unhandled Rejection: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
