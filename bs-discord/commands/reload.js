exports.run = async (client, message, args) => {
  if (!args || args.length < 1) return;

  const resUnload = await client.BSDiscord.commandManager.unloadCommand(args[0]);
  if (resUnload) return message.reply(`読込解除エラー: ${resUnload}`);

  const resReload = client.BSDiscord.commandManager.loadCommand(args[0]);
  if (resReload) return message.reply(`読込エラー: ${resReload}`);

  message.reply(`\`${args[0]}\`コマンドは正常に再読み込みされました。`);
};

exports.conf = {
  name: 'reload',
  enabled: true,
  guildOnly: false,
  aliases: ['rel'],
  permLevel: 'OWN',
};

exports.help = [
  {
    usage: 'reload',
    description: 'コマンドを再読み込み',
  },
];
