module.exports = (MFBGB, oldMember, newMember) => {
  if(!MFBGB.Doppelstimme.ready) return; // Too early!
  
  /*if(oldMember.id === MFBGB.Doppelstimme.user.id){ // When this is me, change my presence
    if(oldMember.voiceChannelID !== newMember.voiceChannelID){ // When entering to a voice channel or moving to another channel
      if(!newMember.voiceChannelID){
        if(oldMember.voiceChannel.guild.id !== MFBGB.config.mainGuild) return;
        
        MFBGB.Doppelstimme.user.setActivity(null);
      } else{
        if(newMember.voiceChannel.guild.id !== MFBGB.config.mainGuild) return;
        
        let str = newMember.voiceChannel.name;
        MFBGB.Doppelstimme.user.setActivity(str, {type: 'LISTENING'});
      }
    }
    return;
  }*/
};
