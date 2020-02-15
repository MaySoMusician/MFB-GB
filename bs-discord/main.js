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

  // Commands are put in collections where they can be read from, catalogued, listed, etc.
  client.BSDiscord.commands = new Enmap();
  // So aliases are
  client.BSDiscord.aliases = new Enmap();

  // ******** OBSOLETED ********
  // Now we integrate the use of Evie's awesome Enhanced Map module, which essentially saves a collection to disk.
  // This is great for per-server configs, and makes things extremely easy for this purpose.
  // client.BSDiscord.settings = new Enmap({provider: new EnmapLevel({name: "settings"})});
  // ******** OBSOLETED ********

  // We're doing real fancy node 8 async/await stuff here, and to do that
  // we need to wrap stuff in an anonymous function. It's annoying but it works.
  const init = async () => {
    // Here we load **commands** into memory, as a collection, so they're accessible here and everywhere else.
    const cmdFiles = await readdir('./bs-discord/commands/'); // somehow readdir method need a parent directory path 'bs-discord'
    client.logger.log(
      `|BS-Discord| Loading a total of ${cmdFiles.length} commands...`
    );
    cmdFiles.forEach(f => {
      if (!f.endsWith('.js')) return; // if it's not js file, just ignore it.
      const response = client.BSDiscord.loadCommand(f);
      if (response) console.log(response);
    });

    // Then we load events, which will include our message and ready event.
    const evtFiles = await readdir('./bs-discord/events/');
    client.logger.log(
      `|BS-Discord| Loading a total of ${evtFiles.length} events...`
    );
    evtFiles.forEach(file => {
      const eventName = file.split('.')[0];
      client.logger.log(`|BS-Discord| Loading Event: ${eventName}`);
      const event = require(`./events/${file}`);
      // Bind the client to any event, before the existing arguments provided by Discord.js
      // This line is awesome by the way. Just sayin'.
      client.BSDiscord.on(eventName, event.bind(null, client));
    });

    // Generate a cache of client permissions for pretty perms
    client.BSDiscord.levelCache = {};
    for (let i = 0; i < client.config.permLevels.length; i++) {
      const thisLevel = client.config.permLevels[i];
      client.BSDiscord.levelCache[thisLevel.index] = thisLevel.level;
    }
    // Let's login!
    client.BSDiscord.login(client.config.token['BSDiscord']);
    // End top-level async/await function.
  };

  init();
};
