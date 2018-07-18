module.exports = async MFBGB => {
  // Log that the bot is online.
  MFBGB.logger.log(`|BS-Discord| [READY] ${client.user.tag}, ready to serve ${client.users.size} users in ${client.guilds.size} servers.`, "RDY");

  // Make the bot "play the game" which is the help command with default prefix.
  MFBGB.BSDiscord.user.setActivity(`${MFBGB.config.prefix}help`, {type: "PLAYING"});
  
  MFBGB.BSDiscord.ready = true;
};