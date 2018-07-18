module.exports = (MFBGB) => {
  /* MISCELLANEOUS NON-CRITICAL FUNCTIONS */ 

  // <Array>.random() returns a single random element from an array
  // [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
  Array.prototype.random = function() {
    return this[Math.floor(Math.random() * this.length)]
  };

  // `await client.wait(1000);` to "pause" for 1 second.
  MFBGB.wait = require("util").promisify(setTimeout);

  // These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
  process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    MFBGB.logger.error(`Uncaught Exception: ${errorMsg}`);
    // Always best practice to let the code crash on uncaught exceptions. 
    // Because you should be catching them anyway.
    process.exit(1);
  });

  process.on("unhandledRejection", err => {
    MFBGB.logger.error(`Unhandled rejection: ${err}`);
  });
};