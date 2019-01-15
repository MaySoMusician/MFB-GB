exports.run = async (MFBGB, message, args) => {
  message.delete().catch(e => {
    console.error(e);
  });
  const g = message.guild,
        subCmdStr = args.join(' '),
        subCommands = {};
  let subCmdName = args.shift(),
      radioVoiceCnl,
      radioTextCnlID,
      radioTextCnl = null;

  if (subCmdName) subCmdName = subCmdName.toLowerCase();

  const getCnls = () => { // eslint-disable-line one-var
    /* eslint-disable indent */
    radioVoiceCnl = g.channels.find(c => c.type === 'voice' && c.name === args[args.length - 1]) // Get the voice channel if its name is provided at the last argument
                    || (message.member.voiceChannel ? message.member.voiceChannel // Otherwise, get the channel the sender is currently in
                                                    : null); // If the sender is NOT in any voice channels, return null and end the command
    /* eslint-enable indent */
    if (radioVoiceCnl === null) {
      MFBGB.Logger.warn(`|BS-Discord| The message sender doesn't provide any voice channel name, nor isn't in any channel, though it's needed`);
      return false;
    }

    radioTextCnlID = MFBGB.getTextCnlIdByVoiceCnl(g, radioVoiceCnl);
    if (radioTextCnlID) radioTextCnl = g.channels.get(radioTextCnlID);

    return true;
  };

  const setVol = async (destVol, fadeTime) => { // eslint-disable-line one-var
    if (destVol === null || destVol === '' || typeof destVol === 'undefined' || // If destVol is null, "", or undefined,
       isNaN(destVol = destVol - 0)) { // or if it's Not a Number
      const current = (MFBGB.MusicPlayer.data[g.id].vol * 100).toFixed(2);
      message.reply(`現在の音量: ${current}%`);
    } else {
      destVol = destVol / 100; // to percentage
      if (fadeTime === 0) MFBGB.MusicPlayer.cmds.changeVol({guild: g, destVol: destVol, dry: false});
      else await MFBGB.MusicPlayer.cmds.fadeVol({guild: g, destVol: destVol, fadeTime: fadeTime, dry: false});
    }
  };

  subCommands['help'] = args => {
    const outputGenerators = {
      'DEFAULT': () => {
        let output = '';

        output += `= radiobgmコマンド ヘルプ =
音楽を再生します(YouTube/ローカルファイル)

== !!radiobgm play yt <動画ID> <音量> ==
YouTubeの動画を再生します(著作権に注意)
https://www.youtube.com/watch?v=<動画ID>

== !!radiobgm play <BGM名> ==
ローカルに保存されているファイルを再生します
`;
        const soundNames = Array.from(Object.keys(MFBGB.MusicPlayer.sounds)),
              longest = soundNames.reduce((long, str) => Math.max(long, str.length), 0);
        new Map(Object.entries(MFBGB.MusicPlayer.sounds)).forEach((datum, alias) => {
          output += ` ${alias}${' '.repeat(longest - alias.length)} - ${datum.descShort}\n`; // Add a line break
        });

        output += `
== !!radiobgm pause ==
再生中のBGM・ジングルを一時停止させます

== !!radiobgm resume ==
一時停止中のBGM・ジングルを再開させます

== !!radiobgm stop ==
再生中のBGM・ジングルを停止させます

== !!radiobgm vol ==
現在の音量を表示します

== !!radiobgm vol <音量> ==
音量を変更します (フェード無し)

== !!radiobgm fade <音量> <フェードミリ秒> ==
音量を変更します (フェードあり)
フェード時間はミリ秒(1000分の1秒)で指定します

== !!radiobgm help ==
このヘルプを表示します。

== 音量について ==
YouTubeからBGMを再生する場合のみ、音量を指定可能
音量は%指定(1.0 = 100%, 0.01 = 1%)`;

        return output;
      },
    };

    const wantedCmd = Object.keys(outputGenerators).includes(args[0]) ? args[0] : 'DEFAULT'; // eslint-disable-line one-var
    message.channel.send(outputGenerators[wantedCmd](), {code: 'asciidoc', split: {char: '\u200b'}});
  };

  subCommands['reset'] = args => {
    MFBGB.MusicPlayer.cmds.forceReset(g);
  };

  subCommands['info'] = args => {
    console.log(MFBGB.MusicPlayer.data[g.id]);
  };

  subCommands['play'] = async args => {
    if (!getCnls()) return; // Quit if we couldn't get the voice channel

    const arg0 = args.shift();
    if (arg0) arg0.toLowerCase();
    else return; // Quit if we have no arguments

    const playSubCommands = {
      'yt': async () => {
        const movieID = args.shift();
        let vol = parseFloat(args.shift());

        vol = vol ? vol / 100 : 0.01;

        await MFBGB.MusicPlayer.cmds.playYouTube({
          guild: g,
          cnl: radioVoiceCnl,
          movieID: movieID,
          opts: {vol: vol},
          funcOnStart: async () => {
            await MFBGB.wait(500);
            if (radioTextCnl && !(args.includes('-silent'))) radioTextCnl.send(`BGM: https://www.youtube.com/watch?v=${movieID}`);
          },
        });

        MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Started playing from YouTube`);
      },
      'DEFAULT': async () => {
        const alias = arg0;
        if (alias in MFBGB.MusicPlayer.sounds) {
          const soundDatum = MFBGB.MusicPlayer.sounds[alias];

          await MFBGB.MusicPlayer.cmds.playFileByAlias({
            guild: g,
            cnl: radioVoiceCnl,
            alias: alias,
            opts: {vol: soundDatum.defaultVol},
            funcOnStart: async () => {
              await MFBGB.wait(500);
              if (radioTextCnl && soundDatum.descLong !== null && !(args.includes('-silent'))) radioTextCnl.send(soundDatum.descLong);
            },
          });
          MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Started playing from local`);
        }
      },
    };

    /* let v;
    if(v = parseFloat(arg0)){
      setVol(v, 0);
      return;
    }*/

    const playSubCmdName = Object.keys(playSubCommands).includes(arg0) ? arg0 : 'DEFAULT'; // eslint-disable-line one-var
    playSubCommands[playSubCmdName]();
  };

  subCommands['pause'] = async args => {
    if (!getCnls()) return false; // Quit if we couldn't get the voice channel
    await MFBGB.MusicPlayer.cmds.pause({
      guild: g,
      fadeTime: 1000,
    });
    MFBGB.Logger.log(`|BS-Discord| Paused`);
  };

  subCommands['resume'] = async args => {
    if (!getCnls()) return false; // Quit if we couldn't get the voice channel
    await MFBGB.MusicPlayer.cmds.resume({
      guild: g,
      fadeTime: 1000,
    });
    MFBGB.Logger.log(`|BS-Discord| Resumed`);
  };

  subCommands['stop'] = async args => {
    if (!getCnls()) return false; // Quit if we couldn't get the voice channel
    await MFBGB.MusicPlayer.cmds.stop({
      guild: g,
      fadeTime: 2000,
      reason: 'User',
    });
    MFBGB.Logger.log(`|BS-Discord| Stopped`);
  };

  subCommands['vol'] = async args => {
    if (!getCnls()) return false; // Quit if we couldn't get the voice channel
    await setVol(args.shift(), 0);
    MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Set/got volume`);
  };

  subCommands['fade'] = async args => {
    if (!getCnls()) return false; // Quit if we couldn't get the voice channel
    await setVol(args.shift(), args.shift());
    MFBGB.Logger.log(`|BS-Discord| Subcommand: ${subCmdStr} ::: Faded volume`);
  };
  subCmdName = Object.keys(subCommands).includes(subCmdName) ? subCmdName : 'help';
  subCommands[subCmdName](args);
  return;
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'STF',
};

exports.help = {
  name: 'radiobgm',
  category: 'RADIO',
  description: 'ラジオ用BGMコマンド',
  usage: 'radiobgm <サブコマンド名> <サブコマンド引数>',
};
