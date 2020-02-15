// This will check if the node version you are running is the required Node version,
// if it isn't it will throw the following error to inform you.
if (process.version.slice(1).split('.')[0] < 8) throw new Error('Node 8.0.0 or higher is required. Update Node on your system.');

// The root of everything
const client = {};

// Initialize basic functions
require('./underside/basic.js')(client);

// Compressed Hexdecimal
require('./underside/compressedHex.js')(client);

// Initialize console logger
client.Logger = require('./underside/logger.js');

// Load common settings
try {
  client.config = require('./config.js');
} catch (_) {
  client.config = {
    // Bot Owner, level 9 by default. A User ID. Should never be anything else than the bot owner's ID.
    ownerID: process.env.OWNER_ID,

    // Staffs, level 5 by default. Array of user ID strings.
    staffs: process.env.STAFFS,

    // Bot's Token. Check on https://discordapp.com/developers/applications/me
    token: process.env.TOKEN,

    // A Discord guild the bot is targeting. A guild ID.
    mainGuild: process.env.MAIN_GUILD,

    // A Discord guild for front-end logging. A guild ID.
    logGuild: process.env.LOG_GUILD,

    // Discord guilds where bot's annoucements are posted. Array of guild ID strings.
    announcementGuild: process.env.ANNOUNCEMENT_GUILD,

    darkskyApiKey: process.env.DARKSKY_API_KEY,

    // Prefix of commands. Strings
    prefix: process.env.PREFIX,

    // PERMISSION LEVEL DEFINITIONS
    permLevels: process.env.PERM_LEVELS,
  };
}

// Load settings per guild
client.vpg = require('./valuePerGuild.js');
client.vpg.getVPG = gID => {
  if (gID in client.vpg) return client.vpg[gID];
  else return null;
};

// Initialize Emojis
require('./underside/emojis.js')(client);

// Initialize Broadcasting System on Discord
require('./bs-discord/main.js')(client);

// Initialize the task scheduler
require('./underside/scheduler.js')(client);
