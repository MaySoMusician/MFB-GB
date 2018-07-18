exports.run = async (XPBot, message, args, level) => {// eslint-disable-line no-unused-vars
  //let msgDie = await message.reply("XPFaucetBotはシャットダウンしています");
  XPBot.ready = false;
  
  await XPBot.wait(100);
  
  XPBot.commands.forEach( async cmd => {
    await XPBot.unloadCommand(cmd);
  });
  
  /*XPBot.db.forEach(async db =>{
    await db.closeFromDB();
  });*/
  
  for(dbName in XPBot.db){
    await XPBot.db[dbName].closeFromDB();
  }
  message.reply("XPFaucetBotはシャットダウンできます")
    .then(()=> {
    XPBot.user.setStatus("invisible");
    XPBot.ready = false;
  });
  
  /*await XPBot.db.walletDB.closeFromDB()
    .then(()=> message.reply("XPFaucetBotはシャットダウンできます"))
    //.then(()=> msgDie.delete())
    .then(()=> XPBot.user.setStatus("invisible"));*/
  //process.exit(1);
  
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "水道局幹部"
};

exports.help = {
  name: "die",
  category: "システム",
  description: "Botを終了待機状態にします。",
  usage: "die"
};
