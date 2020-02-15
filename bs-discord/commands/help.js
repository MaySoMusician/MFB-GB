/*
The HELP command is used to display every command's name and description to the user,
so that he may see what commands are available.
The help command is also filtered by level, so if a user does not have access to a command, it is not shown to them.
*/
const Discord = require('discord.js');

exports.run = async (client, message, args) => {
  const cmdsAvailable = client.BSDiscord.commandManager.getCommandsAvailableForUser(message.author.id, !message.guild),
        helpEmbed =
          new Discord.RichEmbed()
            .setTitle(`MFB-GB BS-Discord`)
            .setDescription(`${message.author.tag} が実行できるコマンドの一覧`)
            .setColor(0x00ff00);

  cmdsAvailable.forEach(c => c.help.forEach(h => {
    const usage = client.config.prefix + h.usage,
          desc = c.conf.aliases.length > 0 ? h.description + '\n[別名: ' + c.conf.aliases.join(', ') + ']'
                                        : h.description; // eslint-disable-line indent, operator-linebreak
    helpEmbed.addField(usage, desc);
  }));

  await message.channel.send(helpEmbed);
};

exports.conf = {
  name: 'help',
  enabled: true,
  guildOnly: false,
  aliases: ['h'],
  permLevel: 'USR',
};

exports.help = [
  {
    usage: 'help',
    description: '権限レベルに合わせて使用可能なコマンドを全て表示',
  },
];
