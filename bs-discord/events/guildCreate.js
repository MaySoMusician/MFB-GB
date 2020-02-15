// This event executes when a new guild (server) is joined.

module.exports = (client, guild) => {
  client.logger.warn(`|BS-Discord| [GUILD JOIN] ${guild.name} (${guild.id}) Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`);
};
