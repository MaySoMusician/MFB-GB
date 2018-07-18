// Load up the discord.js library
const Discord = require("discord.js");

module.exports = (MFBGB) => {
  
  // Discord bot client for broadcasting system
  MFBGB.BSDiscord = new Discord.Client({
    messageCacheLifetime: 21600,
    messageSweepInterval: 3600
  });
  
  // Reset flag of initialization
  MFBGB.BSDiscord.ready = false;

  // Load settings per guild
  MFBGB.BSDiscord.vpg = require("./valuePerGuild.js");

  // Load some useful functions, collection, etc.
  require("./modules/functions.js")(MFBGB);
  require("./modules/emojis.js")(MFBGB);


  // Commands are put in collections where they can be read from, catalogued, listed, etc.
  MFBGB.BSDiscord.commands = new Enmap();
  // So aliases are
  MFBGB.BSDiscord.aliases = new Enmap(); 
   
  // ******** OBSOLETED ********
  // Now we integrate the use of Evie's awesome Enhanced Map module, which essentially saves a collection to disk.
  // This is great for per-server configs, and makes things extremely easy for this purpose.
  //MFBGB.BSDiscord.settings = new Enmap({provider: new EnmapLevel({name: "settings"})});
  // ******** OBSOLETED ********
  
  // We're doing real fancy node 8 async/await stuff here, and to do that
  // we need to wrap stuff in an anonymous function. It's annoying but it works.
  const init = async () => {

    // Here we load **commands** into memory, as a collection, so they're accessible here and everywhere else.
    const cmdFiles = await readdir("./commands/");
    MFBGB.logger.log(`|BS-Discord| Loading a total of ${cmdFiles.length} commands...`);
    cmdFiles.forEach(f => {
      if(!f.endsWith(".js")) return; // if it's not js file, just ignore it.
      const response = MFBGB.BSDiscord.loadCommand(f);
      if(response) console.log(response);
    });

    // Then we load events, which will include our message and ready event.
    const evtFiles = await readdir("./events/");
    MFBGB.logger.log(`|BS-Discord| Loading a total of ${evtFiles.length} events...`);
    evtFiles.forEach(file => {
      const eventName = file.split(".")[0];
      const event = require(`./events/${file}`);
      // This line is awesome by the way. Just sayin'.
      MFBGB.BSDiscord.on(eventName, event.bind(null, MFBGB));
      const mod = require.cache[require.resolve(`./events/${file}`)];
      delete require.cache[require.resolve(`./events/${file}`)];
      for (let i = 0; i < mod.parent.children.length; i++) {
        if (mod.parent.children[i] === mod) {
          mod.parent.children.splice(i, 1);
          break;
        }
      }
    });

    // Generate a cache of client permissions for pretty perms
    MFBGB.BSDiscord.levelCache = {};
    for (let i = 0; i < MFBGB.config.permLevels.length; i++) {
      const thisLevel = MFBGB.config.permLevels[i];
      MFBGB.BSDiscord.levelCache[thisLevel.index] = thisLevel.level;
    }
    // Let's login!
    MFBGB.BSDiscord.login(MFBGB.config.token);
    // End top-level async/await function.
  };

  init();

};
