exports.run = async (MFBGB, message, args) => {// eslint-disable-line no-unused-vars
  MFBGB.BSDiscord.ready = false;
  //await MFBGB.wait(100);
  let msgDying = await message.reply("再起動します");
  
  MFBGB.BSDiscord.commands.forEach(async cmd => {
    await MFBGB.BSDiscord.unloadCommand(cmd);
  });

  /*for(dbName in XPBot.db){
    await XPBot.db[dbName].closeFromDB();
  }*/
  
  msgDying.delete().then(()=> {
    MFBGB.BSDiscord.user.setStatus("invisible");
    process.exit(1);
  });
  
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "OWN"
};

exports.help = {
  name: "reboot",
  category: "SYSTEM",
  description: "Botをシャットダウンします。PM2環境では自動的に再起動します。",
  usage: "reboot"
};
