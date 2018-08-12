const Discord = require("discord.js");
module.exports = (MFBGB) => {
  MFBGB.MusicPlayer = {
    data: {}, // contains some data binding to each guild, for controlling the music player
    cmds: {}, // contains methods controlling the music player (e.g. start/stop music)
    utils: {
      formatData: gID => { // initializes MusicPlayer.data[GuildID]
        MFBGB.MusicPlayer.data[gID] = {
          disp: null,
          vol: null,
          queue: [],
          autonext: false
        };
      },
      resetData : gID => { // resets StreamDispatcher and volume
        MFBGB.MusicPlayer.data[gID].disp = null;
        MFBGB.MusicPlayer.data[gID].vol = null;
      }
    }
  };
  
  MFBGB.MusicPlayer.sounds = require('../assets/soundInfo.js'); // Load all the sound info
  
  MFBGB.BSDiscord.guilds.map(g => MFBGB.MusicPlayer.utils.formatData(g.id)); // Init MusicPlayer.data[GuildID] by the guild
  
  require("./cmds.js")(MFBGB);
};