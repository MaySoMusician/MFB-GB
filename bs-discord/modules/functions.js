module.exports = client => {
  /*
  PERMISSION LEVEL FUNCTION
  This is a very basic permission system for commands which uses "levels".
  "spaces" are intentionally left black so you can add them if you want.
  NEVER GIVE ANYONE BUT OWNER THE LEVEL 9! By default this can run any
  command including the VERY DANGEROUS `eval` commands!
  */
  client.BSDiscord.permlevel = message => {
    let permlvl = 0;

    const permOrder = client.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

    while (permOrder.length) {
      const currentLevel = permOrder.shift();
      if (message.guild && currentLevel.guildOnly) continue;
      if (currentLevel.check(message)) {
        permlvl = currentLevel.level;
        break;
      }
    }
    return permlvl;
  };

  /*
  SINGLE-LINE AWAITMESSAGE
  A simple way to grab a single reply, from the user that initiated
  the command. Useful to get "precisions" on certain things...
  USAGE
  const response = await client.awaitReply(msg, "Favourite Color?");
  msg.reply(`Oh, I really love ${response} too!`);
  */
  client.BSDiscord.awaitReply = async (msg, question, limit = 60000) => {
    const filter = m => m.author.id === msg.author.id;
    await msg.channel.send(question);
    try {
      const collected = await msg.channel.awaitMessages(filter, {max: 1, time: limit, errors: ['time']});
      return collected.first().content;
    } catch (e) {
      return false;
    }
  };


  /*
  MESSAGE CLEAN FUNCTION
  "Clean" removes @everyone pings, as well as tokens, and makes code blocks
  escaped so they're shown more easily. As a bonus it resolves promises
  and stringifies objects!
  This is mostly only used by the Eval and Exec commands.
  */
  client.BSDiscord.clean = async (client, text) => {
    if (text && text.constructor.name == 'Promise') text = await text;
    if (typeof evaled !== 'string') text = require('util').inspect(text, {depth: 1});

    text = text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203))
      .replace(client.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0');

    return text;
  };

  client.BSDiscord.loadCommand = commandName => {
    try {
      client.logger.log(`|BS-Discord| Loading Command: ${commandName}.`);
      const props = require(`../commands/${commandName}`);
      if (props.init) {
        props.init(client);
      }
      client.BSDiscord.commands.set(props.help.name, props);
      props.conf.aliases.forEach(alias => {
        client.BSDiscord.aliases.set(alias, props.help.name);
      });
      return false;
    } catch (e) {
      client.logger.error(e.stack);
      return `Unable to load command ${commandName}: ${e}`;
    }
  };

  client.BSDiscord.unloadCommand = async commandName => {
    let command;
    if (client.BSDiscord.commands.has(commandName)) {
      command = client.BSDiscord.commands.get(commandName);
    } else if (client.BSDiscord.aliases.has(commandName)) {
      command = client.BSDiscord.commands.get(client.BSDiscord.aliases.get(commandName));
      return `\`${commandName}\` is one of the aliases of the command \`${command.help.name}\`. Try to unload \`${command.help.name}\`.`;
    }
    if (!command) return `The command \`${commandName}\` doesn't seem to exist Try again!`;

    if (command.shutdown) {
      await command.shutdown(client);
    }
    const mod = require.cache[require.resolve(`../commands/${commandName}.js`)];
    delete require.cache[require.resolve(`../commands/${commandName}.js`)];
    for (let i = 0; i < mod.parent.children.length; i++) {
      if (mod.parent.children[i] === mod) {
        mod.parent.children.splice(i, 1);
        break;
      }
    }
    return false;
  };
};
