const { inspect } = require("util");
exports.run = async (MFBGB, message, args) => { // eslint-disable-line no-unused-vars
  MFBGB.BSDiscord.user.setAvatar(args[0])
    .then(e => {
    MFBGB.Logger.log(`|BS-Discord| Successful! Bot's avatar changed to ${args[0]}`);
  }).catch(err => {
    MFBGB.Logger.error(`|BS-Discord| Failed to bot's avatar changed to ${args[0]}`);
    MFBGB.Logger.error(err);
  });

};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "OWN"
};

exports.help = {
  name: "avatar",
  category: "SYSTEM",
  description: "Botのアイコンを変更します",
  usage: "avatar [URL]"
};
