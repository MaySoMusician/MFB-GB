// const Discord = require("discord.js");
const ytdl = require('ytdl-core');

/* Note 1. Async-await hell zone
 * Note 2. Argument destructuring is easy to call a function when it's dequeued, though it's uneasy to read source codes
 */

module.exports = client => {
  // Registers a destructor to the voice dispatcher binding to the guild
  const _registerDestructor = (guild, cnc) => {
    const data = client.MusicPlayer.data[guild.id];
    data.disp.on('end', reason => { // When the music stops
      client.MusicPlayer.utils.resetData(guild.id); // Reset dispatcher and volume
      if (data.autonext) client.MusicPlayer.cmds.dequeue(guild); // Automatically start the next music in the queue if autonext enabled
    });

    if (cnc.listenerCount('disconnect') < 1) {
      cnc.on('disconnect', () => {
        let disp = client.MusicPlayer.data[guild.id].disp;
        if (disp) disp.end('Disconnected the voice connection somehow.');
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

      data.disp = cnc.playStream(ytStream, { // Let's play the music!
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
      data.disp = cnc.playFile('assets/' + fileName, { // Let's play the music!
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

  /* let _registerDisposingHandler = (gID, cnc) => {
    XPBot.radioCenter.data[gID].disp.on('end', r => {
      XPBot.radioCenter.dataReset(gID);
      if(XPBot.radioCenter.data[gID].autonext) XPBot.radioCenter.ctrler.dequeue(guild);
    });

    let numDcn = cnc.listenerCount('disconnect');
    if(numDcn < 1){
      cnc.on('disconnect', ()=>{
        if(XPBot.radioCenter.data[gID].disp) XPBot.radioCenter.data[gID].disp.end('切断');
      });
    }
  };*/

  /* let playYouTube = async ({guild: guild, cnl: cnl, movieID: movieID, opts: {seek = 0, vol = 0.01}, funcStart: funcStart}) => {
    let gID = guild.id.toString();
    vol = vol - 0;

    if(isNaN(vol)) throw new TypeError('vol は数値に変換できる必要があります');

    if(XPBot.radioCenter.data[gID].disp !== null){
      await XPBot.radioCenter.ctrler.stop(guild, '他のYouTube動画の再生開始');
    }

    cnl.join().then(async cnc => {
      let opts = {seek: seek, volume: vol, passes: 3, bitrate: 'auto'};
      let stream = ytdl('https://www.youtube.com/watch?v=' + movieID, {filter: 'audioonly'});
      await XPBot.wait(100);
      XPBot.radioCenter.data[gID].disp = cnc.playStream(stream, opts);
      if(typeof funcStart === 'function') XPBot.radioCenter.data[gID].disp.on('start', funcStart);

      _registerDisposingHandler(gID, cnc);
      XPBot.radioCenter.data[gID].virtualVol = vol;
    });
  };*/

  /* let playFile = async ({guild: guild, cnl: cnl, fileName: fileName, opts: {seek = 0, vol = 0.01}, funcStart: funcStart}) => {
    let gID = guild.id.toString();
    vol = vol - 0;

    if(isNaN(vol)) throw new TypeError('vol は数値に変換できる必要があります');

    if(XPBot.radioCenter.data[gID].disp !== null){
      await XPBot.radioCenter.ctrler.stop(guild, '他の音楽ファイルの再生開始');
    }

    cnl.join().then(async cnc => {
      let opts = {seek: seek, volume: vol, passes: 3, bitrate: 'auto'};
      XPBot.radioCenter.data[gID].disp = cnc.playFile('././assets/' + fileName, opts);
      if(typeof funcStart === 'function') XPBot.radioCenter.data[gID].disp.on('start', funcStart);

      _registerDisposingHandler(gID, cnc);
      XPBot.radioCenter.data[gID].virtualVol = vol;
    });
  };*/

  /* let playFileAlias = ({guild: guild, cnl: cnl, alias: alias, opts: {seek: seek = 0, vol: vol = 0.01}, funcStart: funcStart}) => {
    if(alias in soundData){
      XPBot.radioCenter.ctrler.playFile({
        guild: guild,
        cnl: cnl,
        fileName: soundData[alias].fileName,
        opts: {seek: seek, vol: vol},
        funcStart: funcStart
      });
    } else
      throw new TypeError('無効な alias です');
  };*/

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

  /* let enqueue = (type, args) => {
    let gID = args.guild.id.toString()
    XPBot.radioCenter.data[gID].queue.push({type: type, args: args});
  };

  let dequeue = (guild) => {
    let gID = guild.id.toString();
    if(XPBot.radioCenter.data[gID].queue.length > 0){
      let {type, args} = XPBot.radioCenter.data[gID].queue.shift();
      XPBot.radioCenter.ctrler[type](args);
    }
  }*/

  // Sets 'autonext' flag by the guild
  client.MusicPlayer.cmds.setAutonext = (guild, value) => {
    client.MusicPlayer.data[guild.id].autonext = value;
  };

  /* let setAutonext = (guild, value) => {
    let gID = guild.id.toString();
    XPBot.radioCenter.data[gID].autonext = value;
  };*/

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
    }
    // By the contrast, if fadeTime is 0, stop the music suddenly

    data.disp.end(reason);
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
    }
    // By the contrast, if fadeTime is 0, pause the music suddenly

    data.disp.pause();
  };

  /* let stop = async (guild, reason = '再生停止') => {
    let gID = guild.id.toString();
    await XPBot.radioCenter.ctrler.fade(guild, 0, 1000, true);
    if(XPBot.radioCenter.data[gID].disp) XPBot.radioCenter.data[gID].disp.end(reason);
  };

  let pause = async (guild) => {
    let gID = guild.id.toString();
    await XPBot.radioCenter.ctrler.fade(guild, 0, 1000, true);
    if(XPBot.radioCenter.data[gID].disp) XPBot.radioCenter.data[gID].disp.pause();
  };*/

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
      client.MusicPlayer.cmds.changeVol({
        guild: guild,
        destVol: 0,
        dry: true,
      });

      await client.wait(200); // idk if this's necessary
      await client.MusicPlayer.cmds.fadeVol({
        guild: guild,
        destVol: destVol,
        fadeTime: 1500,
        dry: false,
      });
    }
  };

  /* let resume = async(guild) => {
    let gID = guild.id.toString();
    if(!XPBot.radioCenter.data[gID].disp) return;

    let vol = XPBot.radioCenter.data[gID].virtualVol;
    XPBot.radioCenter.data[gID].disp.resume();
    XPBot.radioCenter.ctrler.changeVol(guild, 0, false);
    await XPBot.wait(500);
    await XPBot.radioCenter.ctrler.fade(guild, vol, 1500, true);
  }*/

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

  /* let changeVol = (guild, vol, prevVirtualVolChange) => {
    let gID = guild.id.toString();
    if(!XPBot.radioCenter.data[gID].disp) return;
    if(typeof vol !== 'number') throw new TypeError('vol は数値でなければなりません');

    //if(vol > 2) vol = 2;
    if(vol === 0) vol = 0.01;

    if(!prevVirtualVolChange) XPBot.radioCenter.data[gID].virtualVol = vol;

    XPBot.radioCenter.data[gID].disp.setVolume(vol);
    return true;
  }*/

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
        wait = 50,
        freq = fadeTime / wait, // Frequency of fading
        diff = destVol - start,
        step = diff / freq,
        fVol = start; // Current volume in fading

    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < freq; i++) {
        fVol += step;

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
    client.BSDiscord.voiceConnections.find(c => c.channel.guild.id === guild.id).disconnect();
  };

  /* let fade = (guild, vol, fadeSpan, prevVirtualVolChange) => {
    let gID = guild.id.toString();
    if(!XPBot.radioCenter.data[gID].disp) return;
    if(typeof vol !== 'number') throw new TypeError('vol は数値でなければなりません');

    //if(vol > 2) vol = 2;

    if(!prevVirtualVolChange) XPBot.radioCenter.data[gID].virtualVol = vol;

    let start = XPBot.radioCenter.data[gID].disp.volume,
        times = fadeSpan / 50,
        diff = vol - start,
        step = diff / times,
        fVol = start;
    return new Promise(async (resolve, reject) => {
      for(let i = 0; i < times; i++){
        fVol += step;
        if(XPBot.radioCenter.data[gID].disp) XPBot.radioCenter.data[gID].disp.setVolume(fVol);
        else break;
        await XPBot.wait(50);
      }
      if(XPBot.radioCenter.data[gID].disp) XPBot.radioCenter.data[gID].disp.setVolume(vol);
      resolve();
    });
  }*/

  /* let forceReset = (guild) => {
    XPBot.voiceConnections.find(c => {
      return c.channel.guild.id === guild.id
    }).disconnect();
  }*/

  /* let oldCtrler = XPBot.radioCenter.ctrler;

  let newFuncs = {
    playYouTube: playYouTube,
    playFile: playFile,
    playFileAlias: playFileAlias,
    enqueue: enqueue,
    dequeue: dequeue,
    setAutonext: setAutonext,
    stop: stop,
    pause: pause,
    resume: resume,
    changeVol: changeVol,
    fade: fade,
    forceReset: forceReset
  };

  XPBot.radioCenter.ctrler = Object.assign(oldCtrler, newFuncs);

  writeLog = (title, contents)=>{
    XPBot.log('rSnd', contents, title);
  };*/
};
