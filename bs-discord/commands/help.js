/*
The HELP command is used to display every command's name and description to the user,
so that he may see what commands are available.
The help command is also filtered by level, so if a user does not have access to a command,
it is not shown to them. If a command name is given with the help command, its extended help is shown.
*/

exports.run = (client, message, args) => {
  // If no specific command is called, show all filtered commands.
  if (!args[0]) {
    // Filter all commands by which are available for the user's level, using the <Collection>.filter() method.
    const myCommands = message.guild
      ? client.BSDiscord.commands.filter(cmd => client.BSDiscord.levelCache[cmd.conf.permLevel] <= message.author.permLevel)
      : client.BSDiscord.commands.filter(cmd => client.BSDiscord.levelCache[cmd.conf.permLevel] <= message.author.permLevel && cmd.conf.guildOnly !== true);

    // Here we have to get the command names only, and we use that array to get the longest name.
    // This make the help commands "aligned" in the output.
    const commandNames = myCommands.keyArray(), // eslint-disable-line one-var
          longest = commandNames.reduce((long, str) => Math.max(long, str.length), 0);

    let currentCategory = '',
        output = `= コマンド一覧 =\n\n[${client.config.prefix['BSDiscord']}help <コマンド名> で詳細表示]\n`;
    /* eslint-disable */
    const sorted = myCommands.array().sort((p, c) => p.help.category > c.help.category
                                                     ? 1 // eslint-disable-line
                                                     : p.help.name > c.help.name && p.help.category === c.help.category ? 1 : -1 );
    /* eslint-enable */
    sorted.forEach(c => {
      const cat = c.help.category;
      if (currentCategory !== cat) {
        output += `\u200b\n== ${cat} ==\n`;
        currentCategory = cat;
      }
      output += `${client.config.prefix['BSDiscord']}${c.help.name}${' '.repeat(longest - c.help.name.length)} :: ${c.help.description}\n`;
    });
    message.channel.send(output, {
      code: 'asciidoc',
      split: {char: '\u200b'},
    });
  } else {
    // Show individual command's help.
    let command = args[0];
    if (client.BSDiscord.commands.has(command)) {
      command = client.BSDiscord.commands.get(command);
      if (message.author.permLevel < client.BSDiscord.levelCache[command.conf.permLevel]) return; // if you don't have enough permission, you'll be ignored
      /* eslint-disable no-irregular-whitespace */
      message.channel.send(
        `= ${command.help.name} =
${command.help.description}
使用法:: ${command.help.usage}
別名　:: ${command.conf.aliases.join(', ')}
= ${command.help.name} =`,
        {code: 'asciidoc'}
      );
      /* eslint-enable no-irregular-whitespace */
    }
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['h', 'halp'],
  permLevel: 'USR',
};

exports.help = {
  name: 'help',
  category: 'GENERAL',
  description: '権限レベルに合わせて使用可能なコマンドを全て表示します',
  usage: 'help [コマンド名]',
};
