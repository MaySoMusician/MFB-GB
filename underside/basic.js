module.exports = (MFBGB) => {
  /* MISCELLANEOUS NON-CRITICAL FUNCTIONS */

  // EXTENDING NATIVE TYPES IS BAD PRACTICE.
  // Why? Because if JavaScript adds this later, this conflicts with nave code.
  // Also, if some other library you use does this, a conflict also occurs.
  // KNOWTING THIS, however, the following 2 methods are very useful in code, we feel.

  // <Array>.random() returns a single random element from an array
  // [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
  Object.defineProperty(Array.prototype, 'random', {
    value: function() {
      return this[Math.floor(Math.random() * this.length)];
    }
  });

  // <String>.toPropercase() returns a proper-cased string such as:
  // "Mary had a little lamb".toProperCase() returns "Mary Had A Little Lamb"
  Object.defineProperty(String.prototype, "toProperCase", {
    value: function() {
      return this.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
  });

  // `await MFBGB.wait(1000);` to "pause" for 1 second.
  MFBGB.wait = require("util").promisify(setTimeout);
  
  MFBGB.random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  MFBGB.getTextCnlIdByVoiceCnl = (guild, vc) => {
    let vpg = MFBGB.vpg.getVPG(guild.id);
    if(vpg && vpg.VC2TC) return vpg.VC2TC[vc.id];
    return null;
  }

  // These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
  process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    MFBGB.Logger.error(`Uncaught Exception: ${errorMsg}`);
    // Always best practice to let the code crash on uncaught exceptions. 
    // Because you should be catching them anyway.
    process.exit(1);
  });

  process.on("unhandledRejection", err => {
    MFBGB.Logger.error(`Unhandled rejection: ${err}`);
  });
};
