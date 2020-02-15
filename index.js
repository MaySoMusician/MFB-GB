// This will check if the node version you are running is the required Node version,
// if it isn't it will throw the following error to inform you.
if (process.version.slice(1).split('.')[0] < 12) throw new Error('Node 8.0.0 or higher is required. Update Node on your system.');

// The root of everything
const client = {};

// Initialize basic functions
require('./underside/basic.js')(client);

// Compressed Hexdecimal
require('./underside/compressedHex.js')(client);

// Initialize console logger
client.logger = require('./underside/logger.js');

// Load settings
client.config = {};

// A token of the bot. Check on https://discordapp.com/developers/applications/me
client.config.token = process.env.TOKEN;
if (!client.config.token) throw new Error('You must set the token of the bot');

// Bot Owner. A User ID of the bot owner.
client.config.ownerId = process.env.OWNER_ID;

// Staffs. User ID strings separeted by semi-colons (no spaces).
client.config.staff = process.env.STAFFS.split(';');

// A Discord guild the bot targets. A guild ID.
client.config.guildTargeted = process.env.GUILD_TARGETED;

// A Discord guild for front-end logging. A guild ID.
client.config.guildLogging = process.env.GUILD_LOGGING;

// Prefix of commands. String.
client.config.prefix = process.env.PREFIX;

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
