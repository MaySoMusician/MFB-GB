// This event executes when a new guild (server) is joined.

module.exports = (MFBGB, guild) => {
  MFBGB.logger.warn(`|BS-Discord| [GUILD JOIN] ${guild.name} (${guild.id}) Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`);
};