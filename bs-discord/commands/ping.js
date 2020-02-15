exports.run = async (client, message, args) => {
  const msg = await message.channel.send('ピン？');
  msg.edit(`ポン！ 遅延は${msg.createdTimestamp - message.createdTimestamp}ミリ秒。API遅延は${Math.round(client.BSDiscord.ping)}ミリ秒`);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'USR',
};

exports.help = {
  name: 'ping',
  category: 'GENERAL',
  description: 'ピンポンのようでピンポンでないピンポン。遅延を計算します。',
  usage: 'ping',
};
