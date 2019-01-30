module.exports = (MFBGB, oldMember, newMember) => {
  if (!MFBGB.BSDiscord.ready) return; // Too early!

  if (oldMember.id === MFBGB.BSDiscord.user.id) { // When this is me, change my presence
    if (oldMember.voiceChannelID !== newMember.voiceChannelID) { // When entering to a voice channel or moving to another channel
      if (!newMember.voiceChannelID) {
        if (oldMember.voiceChannel.guild.id !== MFBGB.config.mainGuild) return;

        MFBGB.BSDiscord.user.setActivity(null);
      } else {
        if (newMember.voiceChannel.guild.id !== MFBGB.config.mainGuild) return;

        const str = newMember.voiceChannel.name;
        MFBGB.BSDiscord.user.setActivity(str, {type: 'LISTENING'});
      }
    }
    return;
  }

  if (oldMember.user.bot) { // empty
  } else {
    const welcome2VC = m => {
      const radioVoiceCnl = m.voiceChannel,
            radioTextCnlID = MFBGB.getTextCnlIdByVoiceCnl(oldMember.guild, radioVoiceCnl);

      let radioTextCnl = null;
      if (radioTextCnlID) radioTextCnl = oldMember.guild.channels.get(radioTextCnlID);
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

      // let joinMsg = lotSys(MFBGB, joinMsgs, [0.6, 0.3, 0.1]);
      const joinMsg = `<@${m.id}>さん、いらっしゃ～い`;

      radioTextCnl.send(joinMsg)
        .then(async msg => {
          msg.delete(wait4Del).catch(e => {
            if (e.code === 10008) MFBGB.Logger.error(`|BS-Discord| The message has been deleted: ${e.path}`);
            else MFBGB.Logger.error(`|BS-Discord| Unknown error: ${e}\r\n${e.stack}`);
          });
        });
    };

    if (
      (!oldMember.voiceChannel && newMember.voiceChannel)
      || (oldMember.voiceChannel && newMember.voiceChannel
          && oldMember.voiceChannel.id !== newMember.voiceChannel.id)
    ) {
      welcome2VC(newMember);
      return;
    }
  }
};
