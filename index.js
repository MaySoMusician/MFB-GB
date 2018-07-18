// This will check if the node version you are running is the required Node version,
// if it isn't it will throw the following error to inform you.
if(process.version.slice(1).split(".")[0] < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

// Load up the discord.js library
const Discord = require("discord.js");
// Also load the rest of the things we need in this file:
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const EnmapLevel = require("enmap-level");
const moment = require("moment");
require("moment-duration-format");

// The root of everything
const MFBGB = {};

// Load all settings
MFBGB.config = require("./config.js");

// Initialize miscellaneous functions
require("./underside/misc.js")(MFBGB);

// Initialize console logger
MFBGB.logger = require("./underside/logger.js");

// Initialize Broadcasting System on Discord
require("./bs-discord/main.js")(MFBGB);

// 内部処理用関数読み込み
//require("./modules/scheduler.js")(XPBot);

// タスクスケジューラー読み込み
//XPBot.db.taskScdDB.loadTasksNotYet();

