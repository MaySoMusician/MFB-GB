exports.run = async (MFBGB, message, args) => { // eslint-disable-line no-unused-vars
  message.delete().catch(e => {console.error(e)});
  
  let g = message.guild,
      subCmdStr = args.join(" "),
      subCmdName = args.shift();
  
  if(subCmdName === "help"){
    let wanted = args.shift(),
        output = "";
    
    switch(wanted){
      case "bgm":
        output += `= radiocmd bgm コマンドヘルプ
音楽を再生します(YouTube/ローカルファイル)

== !!radiocmd bgm yt <動画ID> <音量> ==
YouTubeの動画を再生します(著作権に注意)
https://www.youtube.com/watch?v=<動画ID>

== !!radiocmd bgm <BGM名> ==
ローカルに保存されているファイルを再生します
`;
        let soundNames = Array.from(Object.keys(MFBGB.MusicPlayer.sounds)),
            longest = soundNames.reduce((long, str) => Math.max(long, str.length), 0);
        new Map(Object.entries(MFBGB.MusicPlayer.sounds)).forEach((datum, alias) => {
          output += ` ${alias}${" ".repeat(longest - alias.length)} - ${datum.descShort}
`; // Add a line break
        });
        
        output += `
== !!radiocmd bgm pause ==
再生中のBGM・ジングルを一時停止させます

== !!radiocmd bgm resume ==
一時停止中のBGM・ジングルを再開させます

== !!radiocmd bgm stop ==
再生中のBGM・ジングルを停止させます

== !!radiocmd bgm vol ==
現在の音量を表示します

== !!radiocmd bgm vol <音量> ==
音量を変更します (フェード無し)

== !!radiocmd bgm fade <音量> <フェードミリ秒> ==
音量を変更します (フェードあり)
フェード時間はミリ秒(1000分の1秒)で指定します

== 音量について ==
YouTubeからBGMを再生する場合のみ、音量を指定可能
音量は%指定(1.0 = 100%, 0.01 = 1%)`
        break;
      default:
        output += 
          '= radiocmdコマンド ヘルプ =\r\n\r\n' +
          '[!!radiocmd help <サブコマンド名> で詳細表示]\r\n\r\n' + 
          'bgm  :: 音楽を再生します(YouTube/ローカルファイル)\r\n' +
          'help :: このヘルプを表示します。\r\n';
        break;
    }
    message.channel.send(output, {code: "asciidoc", split: { char: "\u200b" }});
    return;
  } else if(subCmdName === "reset"){
    MFBGB.MusicPlayer.cmds.forceReset(g);
    return;
  } else if(subCmdName === "info"){
    console.log(MFBGB.MusicPlayer.data[g.id]);
    return;
  }
  
  let radioVoiceCnl =
      g.channels.find(c => c.type === "voice" && c.name === args[args.length - 1]) || // Get the voice channel if its name is provided at the last argument
      (message.member.voiceChannel ? message.member.voiceChannel // Otherwise, get the channel the sender is currently in
                                   : null); // If the sender is NOT in any voice channels, return null and end the command
  
  if(radioVoiceCnl === null) {
    MFBGB.logger.warn(`|BS-Discord| The message sender doesn't provide any voice channel name, nor isn't in any channel, though it's needed`);
    return;
  }
  
  let radioTextCnlID = MFBGB.getTextCnlIdByVoiceCnl(g, radioVoiceCnl);
  let radioTextCnl = null;
  if(radioTextCnlID) radioTextCnl = g.channels.get(radioTextCnlID);
  
  if(subCmdName === "bgm") {
    let type = args.shift().toLowerCase();
    
    let setVol = async (destVol, fadeTime) => {
      if(destVol === null || destVol === "" || typeof destVol === "undefined" || // If destVol is null, "", or undefined,
        isNaN(destVol = destVol - 0)) { // or if it's Not a Number
        let current = (MFBGB.MusicPlayer.data[g.id].vol * 100).toFixed(2);
        message.reply(`現在の音量: ${current}%`);
      } else{
        destVol = destVol / 100; // to percentage
        if(fadeTime === 0) MFBGB.MusicPlayer.cmds.changeVol({guild: g, destVol: destVol, dry: false});
        else await MFBGB.MusicPlayer.cmds.fadeVol({guild: g, destVol: destVol, fadeTime: fadeTime, dry: false});
      }
    };
    
    let v;
    if(v = parseFloat(type)){
      setVol(v, 0);
      return;
    }
    
    switch(type){
      case "stop":
        await MFBGB.MusicPlayer.cmds.stop({
          guild: g,
          fadeTime: 2000,
          reason: "User"
        });
        MFBGB.logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Stopped`);
        return;
      case "pause":
        await MFBGB.MusicPlayer.cmds.pause({
          guild: g,
          fadeTime: 1000
        });
        MFBGB.logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Paused`);
        return;
      case "resume":
        await MFBGB.MusicPlayer.cmds.resume({
          guild: g,
          fadeTime: 1000
        });
        MFBGB.logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Resumed`);
        return;
      case "vol":
        await setVol(args.shift(), 0);
        MFBGB.logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Set/got volume`);
        return;
      case "fade":
        await setVol(args.shift(), args.shift());
        MFBGB.logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Faded volume`);
        return;
      default:
        break;
    }
    
    if(type === "yt"){ // bgm yt <ID> <vol> [cnl]
      let movieID = args.shift(),
          vol = parseFloat(args.shift());
      
      vol = vol ? vol / 100 : 0.01;
      
      await MFBGB.MusicPlayer.cmds.playYouTube({
        guild: g,
        cnl: radioVoiceCnl,
        movieID: movieID,
        opts: {vol: vol},
        funcOnStart: async () => {
          await MFBGB.wait(500);
          if(radioTextCnl) radioTextCnl.send(`BGM: https://www.youtube.com/watch?v=${movieID}`);
        }
      });
      
      MFBGB.logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Started playing from YouTube`);
      return;
    } else{
      let alias = type;
      if(alias in MFBGB.MusicPlayer.sounds){
        let soundDatum = MFBGB.MusicPlayer.sounds[alias];
        //console.log(soundDatum);
        await MFBGB.MusicPlayer.cmds.playFileByAlias({
          guild: g,
          cnl: radioVoiceCnl,
          alias: alias,
          opts: {vol: soundDatum.defaultVol},
          funcOnStart: async () => {
            await MFBGB.wait(500);
            if(radioTextCnl) radioTextCnl.send(soundDatum.descLong);
          }
        });
        MFBGB.logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Started playing from local`);
        return;
      }
    }
    
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "STF"
};

exports.help = {
  name: "radiocmd",
  category: "RADIO",
  description: "ラジオ用コマンド",
  usage: "radiocmd <サブコマンド名> <サブコマンド引数>"
};
