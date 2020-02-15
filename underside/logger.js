/*
  Logger class for easy and aesthetically pleasing console logging
*/

const chalk = require('chalk'),
      moment = require('moment'),
      log = (content, category, type = 'LOG') => {
        const timestamp = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]:`,
              body = `|${category}| ${content}`;
        switch (type) {
          case 'LOG': return console.log(`${timestamp} ${chalk.bold.bgBlueBright(type.toUpperCase())} ${body} `);
          case 'WAR': return console.error(chalk.yellowBright(`${timestamp} ${chalk.black.bgYellowBright(type.toUpperCase())} ${body} `));
          case 'ERR': return console.error(chalk.redBright.bgWhite(`${timestamp} ${chalk.white.bold.bgRedBright(type.toUpperCase())} ${body} `));
          case 'DBG': return console.log(`${timestamp} ${chalk.bold.green(type.toUpperCase())} ${body} `);
          case 'CMD': return console.log(`${timestamp} ${chalk.black.bgWhite(type.toUpperCase())} ${body}`);
          case 'RDY': return console.log(`${timestamp} ${chalk.black.bgGreen(type.toUpperCase())} ${body}`);
          default: throw new TypeError('Logger type must be either WAR, DBG, LOG, RDY, CMD or ERR.');
        }
      },
      error = (...args) => log(...args, 'ERR'),
      warn = (...args) => log(...args, 'WAR'),
      debug = (...args) => log(...args, 'DBG'),
      cmd = (...args) => log(...args, 'CMD'),
      ready = (...args) => log(...args, 'RDY');

module.exports = {
  log: log,
  error: error,
  warn: warn,
  debug: debug,
  cmd: cmd,
  ready: ready,
};
