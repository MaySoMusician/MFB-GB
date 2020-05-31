const logCategory = 'RadioCnl';

exports.run = async (client, message, args) => {
  message.delete().catch(e => {
    console.error(e);
  });
  const g = message.guild,
        // subCmdStr = args.join(' '),
        subCommands = {};
  let subCmdName = args.shift(),
      radioVoiceCnl;
      // radioTextCnl = null,
      // radioTextCnlID;


  if (subCmdName) subCmdName = subCmdName.toLowerCase();

  const getCnls = () => { // eslint-disable-line one-var
    /* eslint-disable indent */
    // Get the voice channel if its name is provided at the last argument
    radioVoiceCnl = g.channels.cache.find(c => c.type === 'voice' && c.name === args[args.length - 1])
                    || (message.member.voice.channel ? message.member.voice.channel // Otherwise, get the channel the sender is currently in
                                                    : null);
    /* eslint-enable indent */

    if (radioVoiceCnl === null) {
      // Get the default voice channel per guild, even if the sender is NOT in any voice channels
      const defaultVoiveCnlId = client.getDefaultStreamingVoiceCnl(g);
      if (defaultVoiveCnlId) {
        radioVoiceCnl = g.channels.resolve(defaultVoiveCnlId);
      } else {
        // End the command because we don't find the channel to manage
        client.logger.warn(`Can't find the channel to manage: No channel name provided, no channel the sender currently in, no default channel`, logCategory);
        return false;
      }
    }
    // radioTextCnlID = client.getTextCnlIdByVoiceCnl(g, radioVoiceCnl);
    // if (radioTextCnlID) radioTextCnl = g.channels.get(radioTextCnlID);
    return true;
  };

  subCommands['help'] = args => {
    const outputGenerators = {
      'DEFAULT': () => {
        let output = '';

        output += `= radiocnlコマンド ヘルプ =

== !!radiocnl open ==
ラジオ用VCを開場して、一般ユーザーが接続できるようにします

== !!radiocnl close ==
ラジオ用VCを閉場して、一般ユーザーが接続できないようにします`;

        return output;
      },
    };
    // eslint-disable-next-line one-var
    const wantedCmd = Object.keys(outputGenerators).includes(args[0]) ? args[0] : 'DEFAULT';
    message.channel.send(outputGenerators[wantedCmd](), {code: 'asciidoc', split: {char: '\u200b'}});
  };

  subCommands['open'] = args => {
    if (!getCnls()) return;

    const roleEveryone = g.defaultRole;
    radioVoiceCnl.updateOverwrite(
      roleEveryone,
      {'CONNECT': true},
      'Started a radio program'
    ).then(() => {
      client.logger.log(`Opened the voice channel '${radioVoiceCnl.name}'`, logCategory);
    }).catch(e => {
      client.logger.error(`Failed to open the voice channel: 'e'`, logCategory);
    });
  };

  subCommands['close'] = args => {
    if (!getCnls()) return;

    const roleEveryone = g.defaultRole;
    radioVoiceCnl.updateOverwrite(
      roleEveryone,
      {'CONNECT': false},
      'Ended a radio program'
    ).then(() => {
      client.logger.log(`Closed the voice channel '${radioVoiceCnl.name}'`, logCategory);
    }).catch(e => {
      client.logger.error(`Failed to close the voice channel: 'e'`, logCategory);
    });
  };

  subCmdName = Object.keys(subCommands).includes(subCmdName) ? subCmdName : 'help';
  subCommands[subCmdName](args);
  return;
};

exports.conf = {
  name: 'radiocnl',
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'STF',
};

exports.help = [
  {
    usage: 'radiocnl <サブコマンド名> <サブコマンド引数>',
    description: 'ラジオチャンネル 開閉場コマンド',
  },
];
