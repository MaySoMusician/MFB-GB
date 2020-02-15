const {version} = require('discord.js'),
      moment = require('moment');
require('moment-duration-format');

exports.run = async (client, message, args) => {
  const duration = moment.duration(client.uptime).format(' D [日] H [時間] m [分] s [秒]');
  /* eslint-disable no-irregular-whitespace */
  message.channel.send(`= MFB-GB BS-Discord 統計 =
• メモリ使用量 :: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• 稼働時間　　 :: ${duration}
• ユーザー数　 :: ${client.BSDiscord.users.size.toLocaleString()}
• サーバー数　 :: ${client.BSDiscord.guilds.size.toLocaleString()}
• チャンネル数 :: ${client.BSDiscord.channels.size.toLocaleString()}
• Discord.js  :: v${version}
• Node        :: ${process.version}`, {code: 'asciidoc'});
  /* eslint-enable no-irregular-whitespace */
};

exports.conf = {
  name: 'stats',
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'USR',
};

exports.help = [
  {
    usage: 'stats',
    description: '統計を表示',
  },
];
