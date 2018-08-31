const moment = require('moment');

module.exports = MFBGB => {
  let contextReady = {
    'none': {
      check: true,
      planB: () => void 0
    },
    'BSDiscord': {
      check: () => MFBGB.BSDiscord.ready,
      planB: (id, ...args) => {
        MFBGB.BSDiscord.on('ready', (async MFBGB => {
          await MFBGB.wait(1000);
          taskWrapper(id, ...args);
        }).bind(null, MFBGB));
        MFBGB.Logger.warn(`|Scheduler| The task (${id}) will wait for BSDiscord to get ready`);
      }
    }
  };

  return contextReady;
};