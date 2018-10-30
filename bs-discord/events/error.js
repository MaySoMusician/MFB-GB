module.exports = async (MFBGB, error) => {
  MFBGB.Logger.error(`|BS-Discord| An error event was sent by Discord.js: \n${JSON.stringify(error)}`);
};
