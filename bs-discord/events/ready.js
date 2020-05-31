module.exports = async client => {
  // Log that the bot is online.
  client.logger.ready(`${client.BSDiscord.user.tag}, ready to serve ${client.BSDiscord.users.cache.size} users in ${client.BSDiscord.guilds.cache.size} servers.`, 'General');

  // client.BSDiscord.user.setActivity(`${client.config.prefix['BSDiscord']}help`, {type: "PLAYING"});

  // Initialize the music player
  require('../../music-player/main.js')(client);

  // Initialize the subscribable role module
  require('../modules/subscribable-role.js')(client);

  client.BSDiscord.ready = true;
};
