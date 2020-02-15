// The EVAL command will execute **ANY** arbitrary javascript code given to it.
// THIS IS PERMISSION LEVEL 9 FOR A REASON!
// It's perm level 9 because eval can be used to do **anything** on your machine,
// from stealing information to purging the hard drive. DO NOT LET ANYONE ELSE USE THIS

// eslint-disable-next-line no-unused-vars
exports.run = async (client, message, args) => {
  const code = args.join(' ');
  try {
    const evaled = eval(code),
          clean = await client.BSDiscord.clean(client.BSDiscord, evaled);
    message.channel.send(`\`\`\`js\n${clean}\n\`\`\``);
  } catch (err) {
    message.channel.send(`\`ERROR\` \`\`\`xl\n${await client.BSDiscord.clean(client.BSDiscord, err)}\n\`\`\``);
  }
};

exports.conf = {
  name: 'eval',
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'OWN',
};

exports.help = [
  {
    usage: 'eval [...コード]',
    description: '任意のJavascriptコードを実行',
  },
];
