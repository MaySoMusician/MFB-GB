const dbCtrl = require('../../underside/dbCtrl.js');

exports.run = async (MFBGB, message, args) => {// eslint-disable-line no-unused-vars
  MFBGB.BSDiscord.ready = false;
  //await MFBGB.wait(100);
  MFBGB.BSDiscord.commands.forEach(async cmd => {
    await MFBGB.BSDiscord.unloadCommand(cmd);
  });
  
  let promisesClosingDatabase = [];

  for(dbName in MFBGB.db) {
    promisesClosingDatabase.push(dbCtrl.closeDatabase(MFBGB, MFBGB.db[dbName]));
  }

  await Promise.all(promisesClosingDatabase);
  
  message.reply("停止できます").then(()=> {
    MFBGB.BSDiscord.user.setStatus("invisible");
  });
  
  MFBGB.Logger.log('You can now kill me safely');
  
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
