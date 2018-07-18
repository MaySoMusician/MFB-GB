exports.run = async (MFBGB, message, args) => {// eslint-disable-line no-unused-vars
  MFBGB.BSDiscord.ready = false;
  //await MFBGB.wait(100);
  MFBGB.BSDiscord.commands.forEach(async cmd => {
    await MFBGB.BSDiscord.unloadCommand(cmd);
  });
  
  message.reply("停止できます").then(()=> {
    MFBGB.BSDiscord.user.setStatus("invisible");
  });
  
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "OWN"
};

exports.help = {
  name: "die",
  category: "SYSTEM",
  description: "Botを終了待機状態にします。",
  usage: "die"
};
