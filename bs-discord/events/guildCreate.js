// This event executes when a new guild (server) is joined.

module.exports = (client, guild) => {
  client.logger.warn(`[GUILD JOIN] ${guild.name} (${guild.id}) Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`, 'General');
};
