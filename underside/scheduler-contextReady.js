// const moment = require('moment');

module.exports = client => {
  const contextReady = {
    'none': {
      check: true,
      planB: () => void 0,
    },
    'BSDiscord': {
      check: () => client.BSDiscord.ready,
      planB: (taskWrapper, id, ...args) => {
        client.BSDiscord.on('ready', (async client => {
          await client.wait(1000);
          taskWrapper(id, ...args);
        }).bind(null, client));
        client.logger.warn(`|Scheduler| The task (${id}) will wait for BSDiscord to get ready`);
      },
    },
  };
  return contextReady;
};
