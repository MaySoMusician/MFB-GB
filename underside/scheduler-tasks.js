const moment = require('moment');

module.exports = client => {
  const tasks = {
    'testScheduler': params => {
      client.logger.log(`We've just begun a task named 'testScheduler'.`);
      client.logger.log(`This is a test for client Scheduler.`);
      client.logger.log(`Current date: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
      client.logger.log(`Given parameters: ${params}`);
      client.logger.log(`We're about to finish the test successfully.`);
      return true;
    },
    'testFail': params => {
      client.logger.log(`This is a test that fails intentionally`);
      client.logger.warn(`Logging this as a warning`);
      client.logger.error(`Logging this as an error`);
      client.logger.debug(`Logging this as a debug info`);
      client.logger.log(`We're about to finish the test successfully per se, returning false.`);
      return false;
    },
    'playTimeSignal': params => {

    },
    'playBgm': params => {

    },
    'expireSubscribableRole': async params => {
      const {roleId} = params;
      client.logger.debug(roleId);
      try {
        await client.BSDiscord.SubscribableRole.expire(roleId);
      } catch (e) {
        client.logger.error(`An error occurred in expireSubscribableRole: ${e}`);
        return false;
      }
      return true;
    },
  };
  return tasks;
};
