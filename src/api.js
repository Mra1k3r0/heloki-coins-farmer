import axios from 'axios';
import https from 'https';
import { log, parseCookies, generateRandomUID } from './utils.js';
//import 'dotenv/config';
import { SocksProxyAgent } from 'socks-proxy-agent';

const baseUrl = 'https://panel.heloki.net';
const loginUrl = `${baseUrl}/auth/login`;
const creditsUrl = `${baseUrl}/store/credits`;
const earnUrl = `${baseUrl}/api/client/store/earn`;

const torProxy = 'socks5://127.0.0.1:9050';
const socksAgent = new SocksProxyAgent(torProxy);

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    // agent: socksAgent
  }),
  maxRedirects: 5,
  timeout: 10000,
  /* proxy: {
    protocol: "http",
    host: "proxy.scrapingbee.com",
    port: 8886,
    auth: {
      username: SCRAPINGBEE_API_KEY,
      password: "block_resources=true&render_js=False&country_code=ph&device=desktop&premium_proxy=true",
    },
  },*/
});

const extractUserInfo = (html) => {
  const regex = /window\.JexactylUser\s*=\s*(\{[^}]+\})/;
  const match = html.match(regex);
  return match && match[1] ? JSON.parse(match[1]) : null;
};

const displayUserInfo = (userInfo) => {
  const line = '─'.repeat(40);
  log('INFO', line);
  log('INFO', `Username: ${userInfo.username}`);
  log('INFO', `Email: ${userInfo.email}`);
  log('INFO', `Store Balance: ${userInfo.store_balance}`);
  log('INFO', `Store CPU: ${userInfo.store_cpu}`);
  log('INFO', `Store Memory: ${userInfo.store_memory}`);
  log('INFO', `Store Disk: ${userInfo.store_disk}`);
  log('INFO', `Store Slots: ${userInfo.store_slots}`);
  log('INFO', `Store Ports: ${userInfo.store_ports}`);
  log('INFO', `Store Backups: ${userInfo.store_backups}`);
  log('INFO', `Store Databases: ${userInfo.store_databases}`);
  log('INFO', line);
};

export const login = async () => {
  const headers = {
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    cookie: parseCookies(process.env.COOKIES),
  };

  try {
    log('INFO', 'Logging in...');
    const loginResponse = await axiosInstance.get(loginUrl, { headers });
    log('INFO', 'Login successful');

    headers.cookie =
      loginResponse.headers['set-cookie']?.map((cookie) => cookie.split(';')[0]).join('; ') ||
      parseCookies(process.env.COOKIES);

    log('INFO', 'Fetching user information...');
    const creditsResponse = await axiosInstance.get(creditsUrl, { headers });
    log('INFO', 'User information fetched');

    const userInfo = extractUserInfo(creditsResponse.data);

    if (userInfo) {
      log('INFO', 'User information extracted successfully');
      displayUserInfo(userInfo);
      return { userInfo, headers };
    } else {
      log('ERROR', 'Failed to extract user information');
      return null;
    }
  } catch (error) {
    log('ERROR', `Error occurred during login: ${error.message}`);
    return null;
  }
};

export const heartbeat = async (headers, lastUserInfo, initialBalance, totalEarned) => {
  try {
    const creditsResponse = await axiosInstance.get(creditsUrl, { headers });
    const userInfo = extractUserInfo(creditsResponse.data);

    if (userInfo) {
      const currentBalance = parseFloat(userInfo.store_balance);
      const lastBalance = parseFloat(lastUserInfo.store_balance);

      if (currentBalance !== lastBalance) {
        const earned = currentBalance - lastBalance;
        totalEarned += earned;
        log('INFO', `Balance changed: ${earned > 0 ? '+' : ''}${earned.toFixed(2)} coins`);
        log('INFO', `Current Balance: ${currentBalance}, Total Earned: ${totalEarned}`);
      } else {
        const heartbeatData = {
          timestamp: new Date().toISOString(),
          uid: generateRandomUID(),
          message: 'sent',
        };
        log('DEBUG', `[HEARTBEAT] ${JSON.stringify(heartbeatData)}`);
      }

      return { userInfo, totalEarned };
    }

    log('WARN', 'Failed to extract user information during heartbeat');
    return { userInfo: lastUserInfo, totalEarned };
  } catch (error) {
    log('ERROR', `Error occurred during heartbeat: ${error.message}`);
    return { userInfo: lastUserInfo, totalEarned };
  }
};

export const earnCoins = async (headers) => {
  try {
    const earnHeaders = {
      ...headers,
      accept: 'application/json',
      'content-length': '0',
      origin: baseUrl,
      referer: `${baseUrl}/store/credits`,
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
    };

    const xsrfToken = earnHeaders.cookie.split(';').find((c) => c.trim().startsWith('XSRF-TOKEN='));
    if (xsrfToken) {
      earnHeaders['x-xsrf-token'] = decodeURIComponent(xsrfToken.split('=')[1]);
    }

    log('INFO', 'Sending earn request...');
    const response = await axiosInstance.post(earnUrl, null, { headers: earnHeaders });

    /*if (response.status === 200) {
      if (response.data && response.data.success) {*/
    log('INFO', 'Earn request successful');
    log('DEBUG', 'Earn response', response.data);
    return true;
    /* } else {
        log('WARN', 'Earn request returned success: false or unexpected data structure');
        log('DEBUG', 'Earn response', response.data);
        return false;
      }
    } else {
      log('WARN', `Earn request returned unexpected status code: ${response.status}`);
      return false;
    }*/
  } catch (error) {
    log('ERROR', `Error occurred during earn request: ${error.message}`);
    if (error.response) {
      log('ERROR', `Response status: ${error.response.status}`);
      log('ERROR', `Response data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
};
