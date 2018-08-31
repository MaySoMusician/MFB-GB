const moment = require('moment');

module.exports = MFBGB => {
  let tasks = {
    'testScheduler': params => {
      MFBGB.Logger.log(`We've just begun a task named 'testScheduler'.`);
      MFBGB.Logger.log(`This is a test for MFBGB Scheduler.`);
      MFBGB.Logger.log(`Current date: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
      MFBGB.Logger.log(`Given parameters: ${params}`);
      MFBGB.Logger.log(`We're about to finish the test successfully.`);
      return true;
    },
    'testFail': params => {
      MFBGB.Logger.log(`This is a test that fails intentionally`);
      MFBGB.Logger.warn(`Logging this as a warning`);
      MFBGB.Logger.error(`Logging this as an error`);
      MFBGB.Logger.debug(`Logging this as a debug info`);
      MFBGB.Logger.log(`We're about to finish the test successfully per se, returning false.`);
      return false;
    },
    'playTimeSignal': params => {

    },
    'playBgm': params => {

    }
  };
  
  return tasks;
};