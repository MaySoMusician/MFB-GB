module.exports = client => {
  return [
    { // This is the minimum permisison level, this is for non-roled users.
      level: 0,
      index: 'USR',
      // Don't bother checking, just return true which allows them to execute any command their level allows them to.
      check: () => true,
    },
    {
      level: 1,
      index: 'STF',
      check: id => client.config.staffs.includes(id),
    },
    { // This is the bot owner, this should be the highest permission level available.
      // The reason this should be the highest level is because of dangerous commands
      // such as eval or exec (if the owner has that).
      level: 2,
      index: 'OWN',
      // Simple check, compares the message author id to the one stored in the config file.
      check: id => client.config.ownerId === id,
    },
  ];
};
