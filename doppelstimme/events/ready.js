module.exports = async MFBGB => {
  // Log that the bot is online.
  MFBGB.Logger.log(`|Doppelstimme| ${MFBGB.Doppelstimme.user.tag}, ready to serve ${MFBGB.Doppelstimme.users.size} users in ${MFBGB.Doppelstimme.guilds.size} servers.`, "RDY");

  //MFBGB.Doppelstimme.user.setActivity(`${MFBGB.config.prefix['Doppelstimme']}help`, {type: "PLAYING"});
  
  MFBGB.Doppelstimme.ready = true;
};