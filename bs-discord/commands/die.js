const dbCtrl = require('../../underside/dbCtrl.js');

exports.run = async (client, message, args) => {
  // eslint-disable-line no-unused-vars
  client.BSDiscord.ready = false;

  client.BSDiscord.commandManager.commands.forEach(async cmd => await client.BSDiscord.commandManager.unloadCommand(cmd));

  let promisesClosingDatabase = []; // eslint-disable-line prefer-const

  // eslint-disable-next-line prefer-const, guard-for-in
  for (let dbName in client.db) {
    promisesClosingDatabase.push(dbCtrl.closeDatabase(client, client.db[dbName]));
  }

  await Promise.all(promisesClosingDatabase);

  if (args[0] !== 'die') process.exit(1);

  message.reply('停止できます').then(() => {
    client.BSDiscord.user.setStatus('invisible');
  });

  client.logger.log('You can now kill me safely', 'BSDiscord');
};

exports.conf = {
  name: 'die',
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'OWN',
};

exports.help = [
  {
    usage: 'die [die]',
    description: '終了',
  },
];
