const moment = require('moment');

module.exports = client => {
  const tasks = {
    'testScheduler': params => {
      client.Logger.log(`We've just begun a task named 'testScheduler'.`);
      client.Logger.log(`This is a test for client Scheduler.`);
      client.Logger.log(`Current date: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
      client.Logger.log(`Given parameters: ${params}`);
      client.Logger.log(`We're about to finish the test successfully.`);
      return true;
    },
    'testFail': params => {
      client.Logger.log(`This is a test that fails intentionally`);
      client.Logger.warn(`Logging this as a warning`);
      client.Logger.error(`Logging this as an error`);
      client.Logger.debug(`Logging this as a debug info`);
      client.Logger.log(`We're about to finish the test successfully per se, returning false.`);
      return false;
    },
    'playTimeSignal': params => {

    },
    'playBgm': params => {

    },
    'expireSubscribableRole': async params => {
      const {roleId} = params;
      client.Logger.debug(roleId);
      try {
        await client.BSDiscord.SubscribableRole.expire(roleId);
      } catch (e) {
        client.Logger.error(`An error occurred in expireSubscribableRole: ${e}`);
        return false;
      }
      return true;
    },
  };
  return tasks;
};
