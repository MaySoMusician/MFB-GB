const logCategory = 'General';

module.exports = (client, oldState, newState) => {
  if (!client.BSDiscord.ready) return; // Too early!

  const oldMember = oldState.member,
        newMember = newState.member;

  if (oldMember.id === client.BSDiscord.user.id) { // When this is me, change my presence
    if (oldState.channelID !== newState.channelID) { // When entering to a voice channel or moving to another channel
      if (!newState.channelID) {
        if (oldState.guild.id !== client.config.guildTargeted) return;

        client.BSDiscord.user.setActivity(null);
      } else {
        if (newState.guild.id !== client.config.guildTargeted) return;

        const str = newState.channel.name;
        client.BSDiscord.user.setActivity(str, {type: 'LISTENING'});
      }
    }
    return;
  }

  if (oldMember.user.bot) { // empty
  } else {
    const welcome2VC = m => {
      const radioVoiceCnl = m.voice.channel,
            radioTextCnlID = client.getTextCnlIdByVoiceCnl(oldState.guild, radioVoiceCnl);

      let radioTextCnl = null;
      if (radioTextCnlID) radioTextCnl = oldState.guild.channels.resolve(radioTextCnlID);
      else return;

      const numListener = radioVoiceCnl.members.size;
      let wait4Del = 40 * 1000; // 40 secs

      // Overwrite 'wait4Del' according to the number of listeners
      if (numListener >= 200) return; // Abort this, when >=200 people are in the channel
      else if (numListener >= 150) wait4Del = 15 * 1000;
      else if (numListener >= 100) wait4Del = 20 * 1000;
      else if (numListener >= 80) wait4Del = 30 * 1000;

      /*
      const joinMsgs = [
        `<@${m.id}>さん、いらっしゃ～い`,
        `、、、ん！？　そうか！そこで <@${m.id}> か！！`,
        `「まだ <@${m.id}> してないの？」`
      ];*/

      // let joinMsg = lotSys(client, joinMsgs, [0.6, 0.3, 0.1]);
      const joinMsg = `<@${m.id}>さん、いらっしゃ～い`;

      radioTextCnl.send(joinMsg)
        .then(async msg => {
          msg.delete({timeout: wait4Del}).catch(e => {
            if (e.code === 10008) client.logger.error(`|BS-Discord| The message has been deleted: ${e.path}`, logCategory);
            else client.logger.error(`|BS-Discord| Unknown error: ${e}\r\n${e.stack}`, logCategory);
          });
        });
    };

    if (
      (!oldState.channel && newState.channel)
      || (oldState.channel && newState.channel
          && oldState.channel.id !== newState.channel.id)
    ) {
      welcome2VC(newMember);
      return;
    }
  }
};
