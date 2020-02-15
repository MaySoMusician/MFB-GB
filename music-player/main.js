// const Discord = require("discord.js");
module.exports = client => {
  client.MusicPlayer = {
    data: {}, // contains some data binding to each guild, for controlling the music player
    cmds: {}, // contains methods controlling the music player (e.g. start/stop music)
    utils: {
      formatData: gID => { // initializes MusicPlayer.data[GuildID]
        client.MusicPlayer.data[gID] = {
          disp: null,
          vol: null,
          queue: [],
          autonext: false,
        };
      },
      resetData: gID => { // resets StreamDispatcher and volume
        client.MusicPlayer.data[gID].disp = null;
        client.MusicPlayer.data[gID].vol = null;
      },
    },
  };

  client.MusicPlayer.sounds = require('../assets/soundInfo.js'); // Load all the sound info

  client.BSDiscord.guilds.map(g => client.MusicPlayer.utils.formatData(g.id)); // Init MusicPlayer.data[GuildID] by the guild

  require('./cmds.js')(client);
};
