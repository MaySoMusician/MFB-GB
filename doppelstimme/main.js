// Load up the discord.js library
const Discord = require("discord.js");
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const EnmapLevel = require("enmap-level");
const moment = require("moment");
require("moment-duration-format");

module.exports = (MFBGB) => {
  
  // Discord bot client for broadcasting system
  MFBGB.Doppelstimme = new Discord.Client({
    messageCacheLifetime: 21600,
    messageSweepInterval: 3600
  });
  
  // Reset flag of initialization
  MFBGB.Doppelstimme.ready = false;

  // Load some useful functions, collection, etc.
  require("./modules/functions.js")(MFBGB);


  // Commands are put in collections where they can be read from, catalogued, listed, etc.
  MFBGB.Doppelstimme.commands = new Enmap();
  // So aliases are
  MFBGB.Doppelstimme.aliases = new Enmap(); 
   
  // ******** OBSOLETED ********
  // Now we integrate the use of Evie's awesome Enhanced Map module, which essentially saves a collection to disk.
  // This is great for per-server configs, and makes things extremely easy for this purpose.
  //MFBGB.Doppelstimme.settings = new Enmap({provider: new EnmapLevel({name: "settings"})});
  // ******** OBSOLETED ********
  
  // We're doing real fancy node 8 async/await stuff here, and to do that
  // we need to wrap stuff in an anonymous function. It's annoying but it works.
  const init = async () => {

    // Here we load **commands** into memory, as a collection, so they're accessible here and everywhere else.
    const cmdFiles = await readdir("./doppelstimme/commands/"); // somehow readdir method need a parent directory path 'doppelstimme'
    MFBGB.Logger.log(`|Doppelstimme| Loading a total of ${cmdFiles.length} commands...`);
    cmdFiles.forEach(f => {
      if(!f.endsWith(".js")) return; // if it's not js file, just ignore it.
      const response = MFBGB.Doppelstimme.loadCommand(f);
      if(response) console.log(response);
    });

    // Then we load events, which will include our message and ready event.
    const evtFiles = await readdir("./doppelstimme/events/");
    MFBGB.Logger.log(`|Doppelstimme| Loading a total of ${evtFiles.length} events...`);
    evtFiles.forEach(file => {
      const eventName = file.split(".")[0];
      const event = require(`./events/${file}`);
      // This line is awesome by the way. Just sayin'.
      MFBGB.Doppelstimme.on(eventName, event.bind(null, MFBGB));
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
    MFBGB.Doppelstimme.levelCache = {};
    for (let i = 0; i < MFBGB.config.permLevels.length; i++) {
      const thisLevel = MFBGB.config.permLevels[i];
      MFBGB.Doppelstimme.levelCache[thisLevel.index] = thisLevel.level;
    }
    // Let's login!
    MFBGB.Doppelstimme.login(MFBGB.config.token['Doppelstimme']);
    // End top-level async/await function.
  };

  init();

};
