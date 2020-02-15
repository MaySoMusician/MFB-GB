// The MESSAGE event runs anytime a message is received
// Note that due to the binding of the client to every event,
// every event goes `client, other, args` when this function is run.
// const moment = require("moment");
module.exports = (client, message) => {
  if (!client.BSDiscord.ready) return; // Quit if the bot isn't ready yet
  if (message.author.id === client.BSDiscord.user.id) return; // Ignore the messages of the bot itself

  if (message.author.bot) { // When the message comes from another bot
  } else {
    if (!message.content.startsWith(client.config.prefix)) return;
    // Here we separate our "command" name, and our "arguments" for the command.
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g),
          command = args.shift().toLowerCase(),
          cmd = client.BSDiscord.commandManager.getCommand(command);

    // Check whether the command, or alias, exist in the collections defined
    if (!cmd) return; // Quit if the command not found.

    // Some commands may not be useable in PMs.
    // This check prevents those commands from running and return a friendly error message.
    if (!message.guild && cmd.conf.guildOnly) {
      return message.channel.send('指定されたコマンドはDMでは使用できません。サーバー内でお試しください。');
    }

    if (!client.BSDiscord.commandManager.checkPermission(cmd, message.author.id)) {
      return message.channel.send(`:no_entry_sign: このコマンドを実行するのに必要な権限がありません。`);
    }

    return client.BSDiscord.commandManager.run(cmd, message, args);
  }
};
