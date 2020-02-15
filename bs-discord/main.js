// Load up the discord.js library
const Discord = require('discord.js'),
      {promisify} = require('util'),
      readdir = promisify(require('fs').readdir),
      Enmap = require('enmap');
// const moment = require('moment');
// require('moment-duration-format');

module.exports = client => {
  // Discord bot client for broadcasting system
  client.BSDiscord = new Discord.Client({
    messageCacheLifetime: 21600,
    messageSweepInterval: 3600,
  });

  // Reset flag of initialization
  client.BSDiscord.ready = false;

  // Load some useful functions, collection, etc.
  require('./modules/functions.js')(client);

  require('./main.private.js')(client);

  const init = async () => {
    client.BSDiscord.commandManager = new (require('./modules/commandManager.js'))(client, client.logger);
    client.BSDiscord.commandManager.init();

    client.BSDiscord.eventManager = new (require('./modules/eventManager.js'))(client, client.logger);
    client.BSDiscord.eventManager.init();

    // Let's login!
    client.BSDiscord.login(client.config.token);
    // End top-level async/await function.
  };

  init();
};
