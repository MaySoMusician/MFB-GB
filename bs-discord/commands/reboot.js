const dbCtrl = require('../../underside/dbCtrl.js');

exports.run = async (client, message, args) => {// eslint-disable-line no-unused-vars
  client.BSDiscord.ready = false;
  // await client.wait(100);
  const msgDying = await message.reply('再起動します');

  client.BSDiscord.commands.forEach(async cmd => {
    await client.BSDiscord.unloadCommand(cmd);
  });

  const promisesClosingDatabase = [];

  for (const dbName in client.db) { // eslint-disable-line guard-for-in
    promisesClosingDatabase.push(dbCtrl.closeDatabase(client, client.db[dbName]));
  }

  await Promise.all(promisesClosingDatabase);

  msgDying.delete().then(()=> {
    client.BSDiscord.user.setStatus('invisible');
    process.exit(1);
  });
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['reb'],
  permLevel: 'OWN',
};

exports.help = {
  name: 'reboot',
  category: 'SYSTEM',
  description: 'Botをシャットダウンします。PM2環境では自動的に再起動します。',
  usage: 'reboot',
};
