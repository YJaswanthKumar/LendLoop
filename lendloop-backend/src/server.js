const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`LendLoop backend running on port ${env.port} [${env.nodeEnv}]`);
});

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
