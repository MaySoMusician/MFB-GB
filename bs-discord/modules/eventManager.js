const fsp = require('fs').promises,
      logCategory = 'EvtManager';

module.exports = class EventManager {
  #client;
  #logger;

  constructor(client, logger) {
    this.#client = client;
    this.#logger = logger;
  }

  async init() {
    // Here we load commands into memory, as a collection, so they're accessible anywhere.
    const evtFiles = await fsp.readdir('./bs-discord/events');
    this.#logger.log(`Loading a total of ${evtFiles.length} events...`, logCategory);
    for (const f of evtFiles) {
      if (!f.endsWith('.js')) continue; // Ignore files that's not js

      const evtName = f.split('.')[0];
      this.#logger.log(`Loading Event: ${evtName}`, logCategory);
      const event = require(`../events/${f}`);
      // Bind the client to any event, before the existing arguments provided by Discord.js
      // This line is awesome by the way. Just sayin'.
      this.#client.BSDiscord.on(evtName, event.bind(null, this.#client));
    }
  }
};
