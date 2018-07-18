const { inspect } = require("util");
exports.run = async (XPBot, message, args, level) => { // eslint-disable-line no-unused-vars
  XPBot.user.setAvatar(args[0])
    .then(e => {
    XPBot.log('res', 'アイコンを ' + args[0] + ' に変更しました', 'Log');
  }).catch(err => {
    XPBot.log('res', 'アイコン変更に失敗しました: ' + args[0], 'ERR');
    console.error(err);
  });

};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "水道局長"
};

exports.help = {
  name: "avatar",
  category: "システム",
  description: "このBotのアイコンを変更します",
  usage: "avatar [URL]"
};
