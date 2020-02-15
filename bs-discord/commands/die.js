const dbCtrl = require('../../underside/dbCtrl.js');

exports.run = async (client, message, args) => {
  // eslint-disable-line no-unused-vars
  client.BSDiscord.ready = false;
  // await client.wait(100);
  client.BSDiscord.commands.forEach(async cmd => {
    await client.BSDiscord.unloadCommand(cmd);
  });

  let promisesClosingDatabase = []; // eslint-disable-line prefer-const

  // eslint-disable-next-line prefer-const, guard-for-in
  for (let dbName in client.db) {
    promisesClosingDatabase.push(dbCtrl.closeDatabase(client, client.db[dbName]));
  }

  await Promise.all(promisesClosingDatabase);

  message.reply('停止できます').then(() => {
    client.BSDiscord.user.setStatus('invisible');
  });

  client.logger.log('You can now kill me safely');
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'OWN',
};

exports.help = {
  name: 'die',
  category: 'SYSTEM',
  description: 'Botを終了待機状態にします。',
  usage: 'die',
};
