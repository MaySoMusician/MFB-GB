exports.run = async (client, message, args) => {// eslint-disable-line no-unused-vars
  if (args == false || args.size < 1) return message.reply('再読み込みしたいコマンドを指定してね。');

  let response = await client.BSDiscord.unloadCommand(args[0]);
  if (response) return message.reply(`読込解除エラー: ${response}`);

  response = client.BSDiscord.loadCommand(args[0]);
  if (response) return message.reply(`読込エラー: ${response}`);

  message.reply(`\`${args[0]}\`コマンドは正常に再読み込みされました。`);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['rel'],
  permLevel: 'OWN',
};

exports.help = {
  name: 'reload',
  category: 'SYSTEM',
  description: '変更されたコマンドを再読み込みします。',
  usage: 'reload [コマンド名]',
};
