const dbCtrl = require('../../underside/dbCtrl.js');

exports.run = async (MFBGB, message, args) => {// eslint-disable-line no-unused-vars
  MFBGB.BSDiscord.ready = false;
  //await MFBGB.wait(100);
  let msgDying = await message.reply("再起動します");
  
  MFBGB.BSDiscord.commands.forEach(async cmd => {
    await MFBGB.BSDiscord.unloadCommand(cmd);
  });
  
  let promisesClosingDatabase = [];
  
  for(dbName in MFBGB.db) {
    promisesClosingDatabase.push(dbCtrl.closeDatabase(MFBGB, MFBGB.db[dbName]));
  }
  
  await Promise.all(promisesClosingDatabase);
  
  msgDying.delete().then(()=> {
    MFBGB.BSDiscord.user.setStatus("invisible");
    process.exit(1);
  });
  
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['reb'],
  permLevel: "OWN"
};

exports.help = {
  name: "reboot",
  category: "SYSTEM",
  description: "Botをシャットダウンします。PM2環境では自動的に再起動します。",
  usage: "reboot"
};
