import dotenv from 'dotenv';
import { log, displayBanner } from './utils.js';
import { login, heartbeat, earnCoins } from './api.js';
import {
  heartbeatInterval,
  displayInterval,
  sessionRefreshInterval,
  earnRequestInterval,
} from './constants.js';

dotenv.config();

const startHeartbeat = async () => {
  log('INFO', 'Starting login process...');
  let loginResult = await login();

  if (loginResult) {
    log('INFO', 'Starting heartbeat process...');
    let lastUserInfo = loginResult.userInfo;
    let lastDisplayTime = Date.now();
    let initialBalance = parseFloat(lastUserInfo.store_balance);
    let totalEarned = 0;

    const runHeartbeat = async () => {
      try {
        const currentTime = Date.now();
        const { userInfo: updatedUserInfo, totalEarned: updatedTotalEarned } = await heartbeat(
          loginResult.headers,
          lastUserInfo,
          initialBalance,
          totalEarned
        );

        if (currentTime - lastDisplayTime >= displayInterval) {
          const statusMessage = `Username: ${updatedUserInfo.username}, Current Balance: ${updatedUserInfo.store_balance}, Initial Balance: ${initialBalance}, Total Earned: ${updatedTotalEarned}`;
          log('INFO', statusMessage);
          process.send({ type: 'status', message: statusMessage });
          lastDisplayTime = currentTime;
        }

        lastUserInfo = updatedUserInfo;
        totalEarned = updatedTotalEarned;
      } catch (error) {
        log('ERROR', `Error in heartbeat: ${error.message}`);
      }

      setTimeout(runHeartbeat, heartbeatInterval);
    };

    const refreshSession = async () => {
      log('INFO', 'Refreshing session...');
      try {
        const refreshResult = await login();
        if (refreshResult) {
          log('INFO', 'Session refreshed successfully');
          loginResult = refreshResult;
        } else {
          log('ERROR', 'Failed to refresh session');
        }
      } catch (error) {
        log('ERROR', `Error refreshing session: ${error.message}`);
      }
      setTimeout(refreshSession, sessionRefreshInterval);
    };

    const runEarnRequest = async () => {
      await earnCoins(loginResult.headers);
      setTimeout(runEarnRequest, earnRequestInterval);
    };

    runHeartbeat();
    runEarnRequest();
    setTimeout(refreshSession, sessionRefreshInterval);
  } else {
    log('ERROR', 'Failed to start heartbeat process due to login failure.');
    log('WARN', 'Retrying in 30 seconds...');
    setTimeout(startHeartbeat, 30000);
  }
};

displayBanner();
startHeartbeat();

process.on('message', (message) => {
  if (message.type === 'stop') {
    log('INFO', 'Received stop signal from parent process');
    process.exit(0);
  }
});
