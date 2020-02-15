module.exports = async client => {
  // Log that the bot is online.
  client.Logger.log(`|BS-Discord| ${client.BSDiscord.user.tag}, ready to serve ${client.BSDiscord.users.size} users in ${client.BSDiscord.guilds.size} servers.`, 'RDY');

  // client.BSDiscord.user.setActivity(`${client.config.prefix['BSDiscord']}help`, {type: "PLAYING"});

  // Initialize the music player
  require('../../music-player/main.js')(client);

  // Initialize the subscribable role module
  require('../modules/subscribable-role.js')(client);

  client.BSDiscord.ready = true;
};
