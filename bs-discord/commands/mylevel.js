exports.run = async (MFBGB, message, args) => {
  const friendly = MFBGB.config.permLevels.find(l => l.level === message.author.permLevel).name;
  message.reply(`あなたの権限レベル: ${message.author.permLevel} - ${friendly}`);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: 'USR',
};

exports.help = {
  name: 'mylevel',
  category: 'GENERAL',
  description: 'あなたの権限レベルを表示します。',
  usage: 'mylevel',
};
