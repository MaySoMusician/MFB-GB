// const Discord = require("discord.js");
const ytdl = require('ytdl-core');

/* Note 1. Async-await hell zone
 * Note 2. Argument destructuring is easy to call a function when it's dequeued, though it's uneasy to read source codes
 */

module.exports = client => {
  // Registers a destructor to the voice dispatcher binding to the guild
  const _registerDestructor = (guild, cnc) => {
    const data = client.MusicPlayer.data[guild.id];
    data.disp.on('finish', () => { // When the music stops
      client.MusicPlayer.utils.resetData(guild.id); // Reset dispatcher and volume
      if (data.autonext) client.MusicPlayer.cmds.dequeue(guild); // Automatically start the next music in the queue if autonext enabled
    });

    if (cnc.listenerCount('disconnect') < 1) {
      cnc.on('disconnect', () => {
        let disp = client.MusicPlayer.data[guild.id].disp;
        if (disp) disp.destroy('Disconnected the voice connection somehow.');
      });
    }
  };

  // Plays the music from YouTube. seek is considered as seconds; vol is 0.01 by default
  client.MusicPlayer.cmds.playYouTube = async ({ // Argument destructuring is easy to call a function when it's dequeued, though it's uneasy to read source codes
    guild,
    cnl,
    movieID,
    opts: {seek = 0, vol = 0.01},
    funcOnStart,
  }) => {
    if (isNaN(vol = vol - 0)) throw new TypeError("'vol' argument must be converted to a number");

    // Now vol is a number even if we received vol as a string

    let data = client.MusicPlayer.data[guild.id];
    if (data.disp !== null) {
      await client.MusicPlayer.cmds.stop({ // When another music is already playing
        guild: guild,
        reason: 'Starting another YouTube movie',
      });
    }

    cnl.join().then(async cnc => {
      const ytStream = ytdl('https://www.youtube.com/watch?v=' + movieID, {filter: 'audioonly'});
      await client.wait(100); // Just to be safe

      data.disp = cnc.play(ytStream, { // Let's play the music!
        seek: seek,
        volume: vol,
        bitrate: 'auto',
      });
      if (typeof funcOnStart === 'function') data.disp.on('start', funcOnStart); // i.e. just ignore it if it's not a function
      _registerDestructor(guild, cnc);
      data.vol = vol; // Save volume setting for changeVol/fadeVol functions that will be called later
    });
  };

  // Plays the music from local files. seek is considered as seconds; vol is 0.01 by default
  client.MusicPlayer.cmds.playFileByName = async ({
    guild,
    cnl,
    fileName,
    opts: {seek = 0, vol = 0.01},
    funcOnStart,
  }) => {
    if (isNaN(vol = vol - 0)) throw new TypeError("'vol' argument must be converted to a number");

    // Now vol is a number even if we received vol as a string

    let data = client.MusicPlayer.data[guild.id];
    if (data.disp !== null) {
      await client.MusicPlayer.cmds.stop({ // When another music is already playing
        guild: guild,
        reason: 'Starting another music from a local file',
      });
    }

    cnl.join().then(async cnc => {
      data.disp = cnc.play('assets/' + fileName, { // Let's play the music!
        seek: seek,
        volume: vol,
        bitrate: 'auto',
      });

      if (typeof funcOnStart === 'function') data.disp.on('start', funcOnStart); // i.e. just ignore it if it's not a function
      _registerDestructor(guild, cnc);
      data.vol = vol; // Save volume setting for changeVol/fadeVol functions that will be called later
    });
  };

  // Plays the music from local files, specifying by an alias. seek is considered as seconds; vol is 0.01 by default
  client.MusicPlayer.cmds.playFileByAlias = async ({
    guild,
    cnl,
    alias,
    opts: {seek = 0, vol = 0.01},
    funcOnStart,
  }) => {
    if (!(alias in client.MusicPlayer.sounds)) throw new TypeError("Invalid 'alias'");

    client.MusicPlayer.cmds.playFileByName({
      guild: guild,
      cnl: cnl,
      fileName: client.MusicPlayer.sounds[alias].fileName,
      opts: {seek: seek, vol: vol},
      funcOnStart: funcOnStart,
    });
  };

  // Places a command with an argument object in the queue by the guild
  client.MusicPlayer.cmds.enqueue = (cmdName, cmdArgs) => {
    client.MusicPlayer.data[cmdArgs.guild.id].queue.push({cmdName: cmdName, cmdArgs: cmdArgs});
  };

  // Executes the next command in the queue by the guild
  client.MusicPlayer.cmds.dequeue = guild => {
    let data = client.MusicPlayer.data[guild.id];
    if (data.queue.length < 1) return false; // When the queue is empty

    let {cmdName, cmdArgs} = data.queue.shift();
    client.MusicPlayer.cmds[cmdName](cmdArgs); // We can call a function this way thanks to argument destructuring!
    return true;
  };

  // Sets 'autonext' flag by the guild
  client.MusicPlayer.cmds.setAutonext = (guild, value) => {
    client.MusicPlayer.data[guild.id].autonext = value;
  };

  // Stops the music that is currently playing. If fadeTime is 0, the music will stop suddenly; otherwise, it'll stop after turning down its volume gradually
  client.MusicPlayer.cmds.stop = async ({
    guild,
    fadeTime = 2000,
    reason = 'Just stop music - no reasons provided',
  }) => {
    let data = client.MusicPlayer.data[guild.id];
    if (!data.disp) throw new Error("Somehow the StreamDispatcher doesn't exist properly");

    if (fadeTime !== 0) {
      await client.MusicPlayer.cmds.fadeVol({
        guild: guild,
        destVol: 0,
        fadeTime: fadeTime,
        dry: true,
      });
      await client.wait(500);
    }
    // By the contrast, if fadeTime is 0, stop the music suddenly

    data.disp.destroy(reason);
  };

  // Pasues the music that is currently playing. If fadeTime is 0, the music will stop suddenly; otherwise, it'll stop after turning down its volume gradually
  // Of couse, you can resume it later.
  client.MusicPlayer.cmds.pause = async ({
    guild,
    fadeTime = 1000,
  }) => {
    let data = client.MusicPlayer.data[guild.id];
    if (!data.disp) throw new Error("Somehow the StreamDispatcher doesn't exist properly");

    if (fadeTime !== 0) {
      await client.MusicPlayer.cmds.fadeVol({
        guild: guild,
        destVol: 0,
        fadeTime: fadeTime,
        dry: true,
      });
      await client.wait(500);
    }
    // By the contrast, if fadeTime is 0, pause the music suddenly
    data.disp.pause(true);
  };

  // Resumes the music that was playing before. If fadeTime is 0, the music will resume suddenly; otherwise, it'll resume while turning up its volume gradually
  client.MusicPlayer.cmds.resume = async ({
    guild,
    fadeTime = 1000,
  }) => {
    let data = client.MusicPlayer.data[guild.id];
    if (!data.disp) throw new Error("Somehow the StreamDispatcher doesn't exist properly");

    let destVol = data.vol;
    if (fadeTime === 0) {
      data.disp.resume();
      client.MusicPlayer.cmds.changeVol({
        guild: guild,
        destVol: destVol,
        dry: false,
      });
    } else { // With volume fading in
      data.disp.resume();
      /* client.MusicPlayer.cmds.changeVol({
        guild: guild,
        destVol: 0,
        dry: true,
      });*/

      await client.wait(200); // idk if this's necessary
      await client.MusicPlayer.cmds.fadeVol({
        guild: guild,
        destVol: destVol,
        fadeTime: 1500,
        dry: false,
      });
    }
  };

  // Changes the volume. If dry is true, this will NOT change data[GuildID].vol.
  client.MusicPlayer.cmds.changeVol = ({
    guild,
    destVol,
    dry,
  }) => {
    let data = client.MusicPlayer.data[guild.id];
    if (!data.disp) throw new Error("Somehow the StreamDispatcher doesn't exist properly");
    if (isNaN(destVol = destVol - 0)) throw new TypeError("'destVol' argument must be converted to a number");

    if (!dry) data.vol = destVol; // When wet calling
    data.disp.setVolume(destVol);
    return true;
  };

  // Changes the volume with fade. If dry is true, this will NOT change data[GuildID].vol.
  client.MusicPlayer.cmds.fadeVol = ({
    guild,
    destVol,
    fadeTime,
    dry,
  }) => {
    let data = client.MusicPlayer.data[guild.id];
    if (!data.disp) throw new Error("Somehow the StreamDispatcher doesn't exist properly");
    if (isNaN(destVol = destVol - 0)) throw new TypeError("'destVol' argument must be converted to a number");

    if (!dry) data.vol = destVol; // When wet calling

    let start = data.disp.volume, // Volume as of before fading
        wait = 100,
        freq = fadeTime / wait, // Frequency of fading
        diff = destVol - start,
        step = diff / freq,
        fVol = start; // Current volume in fading

    console.log(start, freq, diff, step)

    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < freq; i++) {
        fVol += step;
        // console.log(i, fVol)

        // if(data.disp) will NOT work because data won't be overwritten to null when 'client.MusicPlayer.data[guild.id].disp = null'
        if (client.MusicPlayer.data[guild.id].disp) data.disp.setVolume(fVol);
        else break;

        await client.wait(wait);
      }
      if (client.MusicPlayer.data[guild.id].disp) data.disp.setVolume(destVol);
      resolve();
    });
  };

  client.MusicPlayer.cmds.forceReset = guild => {
    client.BSDiscord.voice.connections.find(c => c.channel.guild.id === guild.id).disconnect();
  };
};
