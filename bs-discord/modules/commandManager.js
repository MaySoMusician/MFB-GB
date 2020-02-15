const Enmap = require('enmap'),
      fsp = require('fs').promises,
      logCategory = 'CmdManager';

module.exports = class CommandManager {
  #client;
  #logger;
  #commands;
  #aliases;
  #permLevels;
  #permLevelCache;

  constructor(client, logger) {
    this.#client = client;
    this.#logger = logger;

    // All commands and aliases are put in collections where they can be read from, catalogued, listed, etc.
    this.#commands = new Enmap();
    this.#aliases = new Enmap();

    // Load user permissions
    this.#permLevels = require('../../underside/constants/permissions.js')(this.#client);

    // Generate a cache of client permissions
    this.#permLevelCache = {};
    for (const current of this.#permLevels) {
      this.#permLevelCache[current.index] = current.level;
    }
  }

  get commands() {
    return this.#commands;
  }

  get aliases() {
    return this.#aliases;
  }

  async init() {
    // Here we load commands into memory, as a collection, so they're accessible anywhere.
    const cmdFiles = await fsp.readdir('./bs-discord/commands');
    this.#logger.log(`Loading a total of ${cmdFiles.length} commands...`, logCategory);
    for (const f of cmdFiles) {
      if (!f.endsWith('.js')) continue; // Ignore files that's not js
      const result = this.loadCommand(f);
      if (result) this.#logger.log(result, logCategory);
    }
  }

  loadCommand(commandName) {
    try {
      this.#logger.log(`Loading Command: ${commandName}.`, logCategory);
      const props = require(`../commands/${commandName}`);
      if (props.init) {
        props.init(this.#client);
      }

      this.commands.set(props.conf.name, props);
      for (const a of props.conf.aliases) {
        this.aliases.set(a, props.conf.name);
      }
      return false;
    } catch (e) {
      this.#logger.error(e.stack, logCategory);
      return `Unable to load command ${commandName}: ${e}`;
    }
  }

  async unloadCommand(commandName) {
    let command;
    if (this.commands.has(commandName)) {
      command = this.commands.get(commandName);
    } else if (this.aliases.has(commandName)) {
      command = this.commands.get(this.aliases.get(commandName));
      return `\`${commandName}\` is one of the aliases of the command \`${command.conf.name}\`. Try to unload \`${command.conf.name}\`.`;
    }
    if (!command) return `The command \`${commandName}\` doesn't seem to exist Try again!`;

    if (command.shutdown) {
      await command.shutdown(this.#client);
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
  }

  _getUserPermLevel(id) {
    const permOrder = this.#permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);
    let permlvl = permOrder[0].level;

    while (permOrder.length) {
      const currentLevel = permOrder.shift();
      if (currentLevel.check(id)) {
        permlvl = currentLevel.level;
        break;
      }
    }
    return permlvl;
  }

  getCommand(commandName) {
    return this.commands.get(commandName) || this.commands.get(this.aliases.get(commandName));
  }

  checkPermission(command, userId) {
    const userLevel = this._getUserPermLevel(userId);
    return userLevel >= this.#permLevelCache[command.conf.permLevel];
  }

  getCommandsAvailableForUser(userId, excludeGuildOnly) {
    if (excludeGuildOnly) return this.commands.filter(cmd => this.checkPermission(cmd, userId) && !cmd.conf.guildOnly);
    else return this.commands.filter(cmd => this.checkPermission(cmd, userId));
  }

  run(command, message, args) {
    const permLevel = this._getUserPermLevel(message.author.id),
          strRequestedCmd = args.length === 0 ? command.conf.name : `${command.conf.name} ${args.join(' ').trim()}`;
    this.#logger.cmd(`${message.author.username}(${message.author.id}, level ${permLevel}) just ran '${strRequestedCmd}'`, logCategory);
    command.run(this.#client, message, args);
  }
};
