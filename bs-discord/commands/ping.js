exports.run = async (client, message, args) => {
  const msg = await message.channel.send('ピン？');
  msg.edit(`ポン！ 遅延は${msg.createdTimestamp - message.createdTimestamp}ミリ秒。API遅延は${Math.round(client.BSDiscord.ping)}ミリ秒`);
};

exports.conf = {
  name: 'ping',
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'USR',
};

exports.help = [
  {
    usage: 'ping',
    description: 'ping値を計測',
  },
];
