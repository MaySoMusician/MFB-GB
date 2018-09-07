exports.run = async (MFBGB, message, args) => { // eslint-disable-line no-unused-vars
  message.delete().catch(e => {console.error(e)});
  
  let g = message.guild,
      subCmdStr = args.join(' '),
      subCmdName = args.shift(),
      subCommands = {},
      radioVoiceCnl,
      radioTextCnlID,
      radioTextCnl = null;
  
  if(subCmdName) subCmdName = subCmdName.toLowerCase();
  
  const getCnls = () => {
    radioVoiceCnl = g.channels.find(c => c.type === 'voice' && c.name === args[args.length - 1]) || // Get the voice channel if its name is provided at the last argument
                    (message.member.voiceChannel ? message.member.voiceChannel // Otherwise, get the channel the sender is currently in
                                                 : null); // If the sender is NOT in any voice channels, return null and end the command
    if(radioVoiceCnl === null) {
      MFBGB.Logger.warn(`|BS-Discord| The message sender doesn't provide any voice channel name, nor isn't in any channel, though it's needed`);
      return false;
    }
    
    radioTextCnlID = MFBGB.getTextCnlIdByVoiceCnl(g, radioVoiceCnl);
    if(radioTextCnlID) radioTextCnl = g.channels.get(radioTextCnlID);
    
    return true;
  };
  
  subCommands['help'] = args => {
    const outputGenerators = {
      'DEFAULT': () => {
        return '= radiocmdコマンド ヘルプ =\r\n\r\n' +
          '[!!radiocmd help <サブコマンド名> で詳細表示]\r\n\r\n' + 
          'bgm  :: 音楽を再生します(YouTube/ローカルファイル)\r\n' +
          'help :: このヘルプを表示します。\r\n';
      },
      'bgm': () => {
        let output = '';
        
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
          output += ` ${alias}${" ".repeat(longest - alias.length)} - ${datum.descShort}\n`; // Add a line break
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
音量は%指定(1.0 = 100%, 0.01 = 1%)`;
        
        return output;
      }
    };
    
    let wantedCmd = Object.keys(outputGenerators).includes(args[0]) ? args[0] : 'DEFAULT';
    message.channel.send(outputGenerators[wantedCmd](), {code: "asciidoc", split: { char: "\u200b" }});
  };
  
  subCommands['reset'] = args => {
    MFBGB.MusicPlayer.cmds.forceReset(g);
  };
  
  subCommands['info'] = args => {
    console.log(MFBGB.MusicPlayer.data[g.id]);
  };
  
  subCommands['bgm'] = async args => {
    if(!getCnls()) return; // Quit if we couldn't get the voice channel
    
    let arg0 = args.shift();
    if(arg0) arg0.toLowerCase();
    else return; // Quit if we have no arguments

    const setVol = async (destVol, fadeTime) => {
      if(destVol === null || destVol === '' || typeof destVol === 'undefined' || // If destVol is null, "", or undefined,
         isNaN(destVol = destVol - 0)) { // or if it's Not a Number
        let current = (MFBGB.MusicPlayer.data[g.id].vol * 100).toFixed(2);
        message.reply(`現在の音量: ${current}%`);
      } else{
        destVol = destVol / 100; // to percentage
        if(fadeTime === 0) MFBGB.MusicPlayer.cmds.changeVol({guild: g, destVol: destVol, dry: false});
        else await MFBGB.MusicPlayer.cmds.fadeVol({guild: g, destVol: destVol, fadeTime: fadeTime, dry: false});
      }
    };
    
    const bgmSubCommands = {
      'stop': async () => {
        await MFBGB.MusicPlayer.cmds.stop({
          guild: g,
          fadeTime: 2000,
          reason: "User"
        });
        MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Stopped`);
      },
      'pause': async () => {
        await MFBGB.MusicPlayer.cmds.pause({
          guild: g,
          fadeTime: 1000
        });
        MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Paused`);
      },
      'resume': async () => {
        await MFBGB.MusicPlayer.cmds.resume({
          guild: g,
          fadeTime: 1000
        });
        MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Resumed`);
      },
      'vol': async () => {
        await setVol(args.shift(), 0);
        MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Set/got volume`);
      },
      'fade': async () => {
        await setVol(args.shift(), args.shift());
        MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Faded volume`);
      },
      'yt': async () => {
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
            if(radioTextCnl && !(args.includes('-silent'))) radioTextCnl.send(`BGM: https://www.youtube.com/watch?v=${movieID}`);
          }
        });

        MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Started playing from YouTube`);
      },
      'DEFAULT': async () => {
        let alias = arg0;
        if(alias in MFBGB.MusicPlayer.sounds){
          let soundDatum = MFBGB.MusicPlayer.sounds[alias];
          
          await MFBGB.MusicPlayer.cmds.playFileByAlias({
            guild: g,
            cnl: radioVoiceCnl,
            alias: alias,
            opts: {vol: soundDatum.defaultVol},
            funcOnStart: async () => {
              await MFBGB.wait(500);
              if(radioTextCnl && !(args.includes('-silent'))) radioTextCnl.send(soundDatum.descLong);
            }
          });
          MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Started playing from local`);
        }
      }
    }

    let v;
    if(v = parseFloat(arg0)){
      setVol(v, 0);
      return;
    }
    
    let bgmSubCmdName = Object.keys(bgmSubCommands).includes(arg0) ? arg0 : 'DEFAULT';
    bgmSubCommands[bgmSubCmdName]();
  };
  
  subCmdName = Object.keys(subCommands).includes(subCmdName) ? subCmdName : 'help';
  subCommands[subCmdName](args);
  return;
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
