import chalk from 'chalk';
import { bannerStyle, debugMode } from './constants.js';

export const getRandomColor = () => {
  const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const log = (level, message, data = null) => {
  if (level === 'DEBUG' && !debugMode) return;

  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  let coloredLevel;
  switch (level) {
    case 'INFO':
      coloredLevel = chalk.blue(level);
      break;
    case 'DEBUG':
      coloredLevel = chalk.green(level);
      break;
    case 'WARN':
      coloredLevel = chalk.yellow(level);
      break;
    case 'ERROR':
      coloredLevel = chalk.red(level);
      break;
    default:
      coloredLevel = level;
  }
  console.log(`[${timestamp}] ${coloredLevel} ${message}`);
  if (level === 'DEBUG' && data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const ASCII_ART_BANNER = `
 ██░ ██ ▓█████  ██▓     ▒█████   ██ ▄█▀ ██▓
▓██░ ██▒▓█   ▀ ▓██▒    ▒██▒  ██▒ ██▄█▒ ▓██▒
▒██▀▀██░▒███   ▒██░    ▒██░  ██▒▓███▄░ ▒██▒
░▓█ ░██ ▒▓█  ▄ ▒██░    ▒██   ██░▓██ █▄ ░██░
░▓█▒░██▓░▒████▒░██████▒░ ████▓▒░▒██▒ █▄░██░
 ▒ ░░▒░▒░░ ▒░ ░░ ▒░▓  ░░ ▒░▒░▒░ ▒ ▒▒ ▓▒░▓  
 ▒ ░▒░ ░ ░ ░  ░░ ░ ▒  ░  ░ ▒ ▒░ ░ ░▒ ▒░ ▒ ░
 ░  ░░ ░   ░     ░ ░   ░ ░ ░ ▒  ░ ░░ ░  ▒ ░
 ░  ░  ░   ░  ░    ░  ░    ░ ░  ░  ░    ░  
                                           
       Coins Farmer by mra1k3r0
`;

const SIMPLE_BANNER = `
╔═══════════════════════════════════════╗
║         Heloki Coins Farmer           ║
║           by mra1k3r0                 ║
╚═══════════════════════════════════════╝
`;

const MINIMAL_BANNER = `
--- Heloki Coins Farmer ---
`;

export const displayBanner = () => {
  const bannerColor = getRandomColor();
  let banner;

  switch (bannerStyle) {
    case 'ASCII_ART':
      banner = ASCII_ART_BANNER;
      break;
    case 'SIMPLE':
      banner = SIMPLE_BANNER;
      break;
    case 'MINIMAL':
      banner = MINIMAL_BANNER;
      break;
    default:
      banner = MINIMAL_BANNER;
  }

  console.log(chalk[bannerColor](banner));
};

export const generateRandomUID = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const parseCookies = (cookiesString) => {
  return cookiesString
    ? cookiesString
        .split(';')
        .map((cookie) => cookie.trim())
        .join('; ')
    : '';
};
