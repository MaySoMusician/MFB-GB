// The MESSAGE event runs anytime a message is received
// Note that due to the binding of MFBGB to every event, every event goes `MFBGB, other, args` when this function is run.
const moment = require("moment");
module.exports = (MFBGB, message) => {
  if(!MFBGB.BSDiscord.ready) return; // when 'ready' handler is still ongoing, ignore messages to me.
  if(message.author.id === MFBGB.BSDiscord.user.id) return; // ignore messages I've sent

  if(message.author.bot){ // when the message comes from another bot
  } else{ // when the message comes from a user

    /*if(message.channel.type == 'dm'){
      let ls = XPBot.getLogServer();
      if(ls){
        let time = moment(message.createdAt).format('YYYY-MM-DD HH:mm:ss.SS');
        ls.channels.find('name', 'dm').send(`\`================================\`
\`\`\`At: ${time}
By: ${message.author.tag} (${message.author.id})\`\`\`
${message.content}

\`================================\``
        );
      }
    }*/

    /*const ainote = require('../modules/ainote.js');
    if(message.channel.name){
      ainote(XPBot, message);
    }*/
    
    // Get the user or member's permission level from the elevation
    const level = MFBGB.BSDiscord.permlevel(message);
    const levelIndex = MFBGB.config.permLevels.find(l => l.level === level).index;
    const levelName = MFBGB.config.permLevels.find(l => l.level === level).name;

    if(message.content.indexOf(MFBGB.config.prefix['BSDiscord']) === 0){
      // Here we separate our "command" name, and our "arguments" for the command.
      // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
      // command = say
      // args = ["Is", "this", "the", "real", "life?"]
      const args = message.content.slice(MFBGB.config.prefix['BSDiscord'].length).trim().split(/ +/g);
      const command = args.shift().toLowerCase();

      // Check whether the command, or alias, exist in the collections defined
      const cmd = MFBGB.BSDiscord.commands.get(command) || MFBGB.BSDiscord.commands.get(MFBGB.BSDiscord.aliases.get(command));
      if(!cmd) return; // return back if the command doesn't exist

      // Some commands may not be useable in DMs. This check prevents those commands from running and return a friendly error message.
      if(cmd && !message.guild && cmd.conf.guildOnly)
        return message.channel.send("指定されたコマンドはDMでは使用できません。サーバー内でお試しください。");

      if(level < MFBGB.BSDiscord.levelCache[cmd.conf.permLevel]) {
        return message.channel.send(`:no_entry_sign: このコマンドを実行するのに必要な権限がありません。
あなたの権限レベル: ${level} (${levelName})
要求されている権限レベル: ${MFBGB.BSDiscord.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})`);
      }

      // To simplify message arguments, the author's level is now put on level (not member so it is supported in DMs)
      message.author.permLevel = level;

      message.flags = [];
      while (args[0] && args[0][0] === "-") {
        message.flags.push(args.shift().slice(1));
      }
      // If the command exists, **AND** the user has permission, run it.
      MFBGB.Logger.cmd(`|BS-Discord| ${message.author.username}(${message.author.id}) as ${levelName} ran '${cmd.help.name} ${args.join(" ")}'`);
      cmd.run(MFBGB, message, args);
    } 
  }
};
