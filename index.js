// This will check if the node version you are running is the required Node version,
// if it isn't it will throw the following error to inform you.
if(process.version.slice(1).split(".")[0] < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

// Load up the discord.js library
const Discord = require("discord.js");
// Also load the rest of the things we need in this file:

// The root of everything
const MFBGB = {};

// Initialize basic functions
require("./underside/basic.js")(MFBGB);

// Initialize console logger
MFBGB.logger = require("./underside/logger.js");

// Load common settings
MFBGB.config = require("./config.js");

// Load settings per guild
MFBGB.vpg = require("./valuePerGuild.js");
MFBGB.vpg.getVPG = (gID) => { 
  if(gID in MFBGB.vpg) return MFBGB.vpg[gID];
  else return null;
};

// Initialize Emojis
require("./underside/emojis.js")(MFBGB);

// Initialize Broadcasting System on Discord
require("./bs-discord/main.js")(MFBGB);
// 内部処理用関数読み込み
//require("./modules/scheduler.js")(XPBot);

// タスクスケジューラー読み込み
//XPBot.db.taskScdDB.loadTasksNotYet();

