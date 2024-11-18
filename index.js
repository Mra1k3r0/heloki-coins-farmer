import 'dotenv/config';
import express from 'express';
import { fork } from 'child_process';
import { log } from './src/utils.js';

const app = express();
const port = process.env.PORT || 3000;

const mainProcess = fork(`${process.cwd()}/src/index.js`);

mainProcess.on('message', (message) => {
  log('INFO', `Message from Heloki Coins Farmer: ${JSON.stringify(message)}`);
});

mainProcess.on('exit', (code) => {
  log('INFO', `Heloki Coins Farmer process exited with code ${code}`);
});

mainProcess.on('error', (error) => {
  log('ERROR', `Error in Heloki Coins Farmer process: ${error.message}`);
});

app.get('/', (req, res) => {
  res.send('Heloki Coins Farmer is running');
});

app.get('/status', (req, res) => {
  res.json({ status: 'farming' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  log('ERROR', `Unhandled error: ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(port, () => {
  log('INFO', `Heloki Coins Farmer server listening on port ${port}`);
});

const gracefulShutdown = (signal) => {
  log('INFO', `${signal} signal received: closing HTTP server`);
  server.close(() => {
    log('INFO', 'HTTP server closed');
    mainProcess.kill();
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      log('ERROR', `Port ${port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      log('ERROR', `Port ${port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});
