const // sqlite3 = require('sqlite3'),
      // sch = require('node-schedule'),
      moment = require('moment'),
      dbCtrl = require('../../underside/dbCtrl.js'),
      path = require('path');
require('moment-duration-format');

module.exports = async MFBGB => {
  MFBGB.BSDiscord.SubscribableRole = {
    loadedRoles: new Map(),
  };

  if (!MFBGB.db) MFBGB.db = {};
  MFBGB.db.subscribableRolesDB = await dbCtrl.openDatabase(MFBGB, path.resolve(__dirname, '../../data/db/subscribable-roles.db'));
  MFBGB.db.subscribableRolesDB.serialize(); // Calling this with no parameter causes the database to set its execution mode for 'serialize'

  const EPOCH = new Date(2018, 7, 11, 20, 0, 0); // Original air date of No-Radio

  const setSingleOption = async (roleId, optionName, optionValue) => { // eslint-disable-line one-var
    let role = MFBGB.BSDiscord.SubscribableRole.loadedRoles.get(roleId);

    if (role) {
      if (optionName === 'roleObj') {
        const err = `'roleObj' cannot be overwritten`;
        throw new RangeError(err);
      }

      if (!role.hasOwnProperty(optionName)) {
        const err = `The option '${optionName}' is unknown`;
        throw new RangeError(err);
      }

      role[optionName] = optionValue;
      updateLoadedRole(roleId, role);
    } else {
      role = await MFBGB.BSDiscord.SubscribableRole.getRoleById(roleId);

      if (!role) {
        const err = `The id '${roleId}' is invalid`;
        throw new TypeError(err);
      }
    }

    return new Promise((resolve, reject) => {
      MFBGB.db.subscribableRolesDB.run(
        `UPDATE roles SET ${optionName} = $optionValue WHERE id = $id`,
        {$optionValue: optionValue, $id: roleId},
        err => {
          if (err) reject(err);

          const discordID = (role.roleObj) ? role.roleObj.id : role.role_guild_id;
          MFBGB.Logger.log(`|SubscribableRole| Set '${optionName}' of the role (In-bot ID: ${roleId}, In-Discord ID: ${discordID}) for '${optionValue}'`);
          resolve();
        }
      );
    });
  };

  const updateLoadedRole = (roleId, newRole) => { // eslint-disable-line one-var
    const role = MFBGB.BSDiscord.SubscribableRole.loadedRoles.get(roleId);

    if (!role) {
      const err = `The id ${roleId} is invalid`;
      throw new TypeError(err);
    }

    MFBGB.BSDiscord.SubscribableRole.loadedRoles.set(roleId, newRole);
    MFBGB.Logger.log(`|SubscribableRole| Updated the loaded role (In-bot ID: ${roleId}, In-Discord ID: ${role.roleObj.id})`);
  };

  // In order for a role not to expire, set dateExpireAt for null
  MFBGB.BSDiscord.SubscribableRole.registerRole = async (alias, guild, dateExpireAt, note) => {
    const strId = (Date.now() - EPOCH) + MFBGB.random(0, 99).toString().padStart(2, '0'),
          numId = +strId, // Convert to a number
          dupRole = await MFBGB.BSDiscord.SubscribableRole.getRoleById(numId);

    if (dupRole) {
      const err = `The id '${strId}' has been used for another role`;
      return Promise.reject(new Error(err));
    }

    const compHexId = MFBGB.compHex.compress(numId.toString(16)),
          name = `${alias}_${compHexId}`,
          neverExpired = dateExpireAt === null,
          strExpireAt = neverExpired ? null : moment(dateExpireAt).format('YYYY-MM-DD HH:mm:ss');
    let expireTaskId = null;

    if (!neverExpired) {
      expireTaskId = await MFBGB.Scheduler.regiterTask(
        /* dateRunAt= */ dateExpireAt,
        /* context= */ 'BSDiscord',
        /* cmd= */ 'expireSubscribableRole',
        /* params= */ {roleId: numId},
        /* note= */ null,
        /* secondsDelayedFor= */ 0
      );
    }

    const newRoleObj = await guild.createRole({ // eslint-disable-line one-var
      name: name,
      color: 'DEFAULT',
      hoist: false,
      permissions: 0,
      mentionable: false,
    }, 'New subcribable role');

    MFBGB.Logger.log(`|SubscribableRole| Created a new role '${name}' (In-bot ID: ${strId}, In-Discord ID: ${newRoleObj.id}) in the guild '${guild.name}' (${guild.id})`);

    const newRoleEntry = {
      id: numId,
      alias: alias,
      expire_at: strExpireAt,
      expire_task_id: expireTaskId,
      note: note,
      status: '',
      roleObj: newRoleObj,
    };

    MFBGB.BSDiscord.SubscribableRole.loadedRoles.set(numId, newRoleEntry);
    MFBGB.Logger.log(`|SubscribableRole| Registered the new role '${name}' (In-bot ID: ${strId}, In-Discord ID: ${newRoleObj.id}) to the MFBGB`);

    return new Promise((resolve, reject) => {
      MFBGB.db.subscribableRolesDB.run(
        'INSERT INTO roles(id, alias, role_id, role_name, role_guild_id, expire_at, expire_task_id, note) VALUES($id, $alias, $role_id, $role_name, $role_guild_id, $expire_at, $expire_task_id, $note)',
        {
          $id: numId,
          $alias: alias,
          $role_id: newRoleObj.id,
          $role_name: newRoleObj.name,
          $role_guild_id: guild.id,
          $expire_at: strExpireAt,
          $expire_task_id: expireTaskId,
          $note: note,
        },
        err => {
          if (err) {
            MFBGB.Logger.error(`|SubscribableRole| Couldn't register the role (In-bot ID: ${strId}, In-Discord ID: ${newRoleObj.id}) in the 'roles' table: ${err}`);
            reject(err);
          }
          MFBGB.Logger.log(`|SubscribableRole| Registered the role (In-bot ID: ${strId}, In-Discord ID: ${newRoleObj.id}) in the 'roles' table`);
          resolve(numId);
        }
      );
    });
  };

  MFBGB.BSDiscord.SubscribableRole.getRoleById = async id => {
    return new Promise((resolve, reject) => {
      MFBGB.db.subscribableRolesDB.get(
        'SELECT * FROM roles WHERE id = $id',
        {$id: id},
        (err, res) => {
          if (err) {
            console.error(err);
            reject(err);
          }

          if (res && MFBGB.BSDiscord.guilds.has(res.role_guild_id)) {
            const g = MFBGB.BSDiscord.guilds.get(res.role_guild_id);
            if (g.roles.has(res.role_id)) res.roleObj = g.roles.get(res.role_id);
            else res.roleObj = null; // probably it's been deleted
          }
          resolve(res);
        }
      );
    });
  };

  MFBGB.BSDiscord.SubscribableRole.setStatus = async (roleId, status) => {
    return setSingleOption(roleId, 'status', status);
  };

  MFBGB.BSDiscord.SubscribableRole.setExpireAt = async (roleId, dateExpireAt) => {
    const role = MFBGB.BSDiscord.SubscribableRole.loadedRoles.get(roleId);

    if (!role) {
      const err = `The id ${roleId} is invalid`;
      throw new TypeError(err);
    }

    const neverExpired = dateExpireAt === null,
          strExpireAt = neverExpired ? null : moment(dateExpireAt).format('YYYY-MM-DD HH:mm:ss');

    return new Promise(async (resolve, reject) => {
      if (role.expire_task_id !== null) {
        MFBGB.Scheduler.deleteTaskById(role.expire_task_id, 'For changing expire_at', 'delayable_tasks');

        role.expire_at = null;
        role.expire_task_id = null;
        updateLoadedRole(roleId, role);

        MFBGB.db.subscribableRolesDB.run(
          'UPDATE roles SET expire_at = NULL, expire_task_id = NULL WHERE id = $id',
          {$id: role.id},
          err => {
            if (err) reject(err);

            MFBGB.Logger.log(`|SubscribableRole| Canceled the expiration task of the role (In-bot ID: ${roleId}, In-Discord ID: ${role.roleObj.id})`);
            resolve();
          }
        );
      }

      if (!neverExpired) {
        const expireTaskId = await MFBGB.Scheduler.regiterTask(
          /* dateRunAt= */ dateExpireAt,
          /* context= */ 'BSDiscord',
          /* cmd= */ 'expireSubscribableRole',
          /* params= */ {roleId: role.id},
          /* note= */ null,
          /* secondsDelayedFor= */ 0
        );

        role.expire_at = strExpireAt;
        role.expire_task_id = expireTaskId;
        updateLoadedRole(roleId, role);

        MFBGB.db.subscribableRolesDB.run(
          'UPDATE roles SET expire_at = $expire_at, expire_task_id = $expire_task_id WHERE id = $id',
          {$expire_at: strExpireAt, $expire_task_id: expireTaskId, $id: role.id},
          err => {
            if (err) reject(err);

            MFBGB.Logger.log(`|SubscribableRole| Set the expiration task of the role (In-bot ID: ${roleId}, In-Discord ID: ${role.roleObj.id})`);
            resolve();
          }
        );
      }
    });
  };

  MFBGB.BSDiscord.SubscribableRole.loadRoleById = async id => {
    const role = await MFBGB.BSDiscord.SubscribableRole.getRoleById(id);
    if (!role) {
      const err = `The subscribable role (${id}) isn't registered in the 'roles' table`;
      throw new Error(err);
    }

    if (role.roleObj === null) {
      await MFBGB.BSDiscord.SubscribableRole.setStatus(id, 'deleted');
      MFBGB.Logger.warn(`|SubscribableRole| The role '${role.role_name}' (In-bot ID: ${id}, In-Discord ID: ${role.role_id}) seems to have been deleted from the guild (${role.role_guild_id}). Set its status for 'deleted'`);
      return;
    }

    if (MFBGB.BSDiscord.SubscribableRole.loadedRoles.has(id)) {
      const err = `The subscribable role '${role.role_name}' (In-bot ID: ${id}, In-Discord ID: ${role.role_id}) has already been loaded`;
      throw new Error(err);
    }

    if (role.status === 'expired' || role.status === 'destroyed') {
      const err = `The subscribable role '${role.role_name}' (In-bot ID: ${id}, In-Discord ID: ${role.role_id}) has been ${role.status}`;
      throw new Error(err);
    }

    MFBGB.BSDiscord.SubscribableRole.loadedRoles.set(id, role);
    MFBGB.Logger.log(`|SubscribableRole| Re-registered the role '${role.role_name}' (In-bot ID: ${id}, In-Discord ID: ${role.role_id}) to the MFBGB`);
  };

  MFBGB.BSDiscord.SubscribableRole.loadOngoingRoles = async () => {
    MFBGB.db.subscribableRolesDB.parallelize(() => {
      MFBGB.db.subscribableRolesDB.each(
        'SELECT id FROM roles WHERE status IS NULL',
        {},
        (err, row) => {
          if (err) {
            MFBGB.Logger.error(`|SubscribableRole| An error occurred during getting ongoing roles from the roles table: ${err}`);
            return;
          }
          try {
            MFBGB.BSDiscord.SubscribableRole.loadRoleById(row.id);
          } catch (e) {
            MFBGB.Logger.error(`|SubscribableRole| An error occurred during loading an ongoing role: ${e}`);
          }
        }
      );
    });
  };

  MFBGB.BSDiscord.SubscribableRole.subscribe = async (roleId, member) => {
    const role = MFBGB.BSDiscord.SubscribableRole.loadedRoles.get(roleId);

    if (!role) {
      const err = `The id ${roleId} is invalid`;
      throw new TypeError(err);
    }

    return member.addRole(role.roleObj.id, 'Subscribe a subscribable role').then(m => {
      MFBGB.Logger.log(`|SubscribableRole| Added the role '${role.roleObj.name}' (In-bot ID: ${roleId}, In-Discord ID: ${role.roleObj.id}) to ${m.user.tag}(${m.user.id})`);
    });
  };

  MFBGB.BSDiscord.SubscribableRole.unsubscribe = async (roleId, member) => {
    const role = MFBGB.BSDiscord.SubscribableRole.loadedRoles.get(roleId);

    if (!role) {
      const err = `The id ${roleId} is invalid`;
      throw new TypeError(err);
    }

    return member.removeRole(role.roleObj.id, 'Unsubscribe a subscribable role').then(m => {
      MFBGB.Logger.log(`|SubscribableRole| Removed the role '${role.roleObj.name}' (In-bot ID: ${roleId}, In-Discord ID: ${role.roleObj.id}) from ${m.user.tag}(${m.user.id})`);
    });
  };

  MFBGB.BSDiscord.SubscribableRole.expire = async roleId => {
    const role = MFBGB.BSDiscord.SubscribableRole.loadedRoles.get(roleId);

    if (!role) {
      const err = `The id ${roleId} is invalid`;
      throw new TypeError(err);
    }

    return role.roleObj.delete('Expire a subscribable role').then(async r => {
      await MFBGB.BSDiscord.SubscribableRole.setStatus(roleId, 'expired');
      MFBGB.BSDiscord.SubscribableRole.loadedRoles.delete(roleId);

      MFBGB.Logger.log(`|SubscribableRole| The role '${role.roleObj.name}' (In-bot ID: ${roleId}, In-Discord ID: ${role.roleObj.id}) has expired`);
    });
  };

  const tables = [
    {
      name: 'roles',
      query: 'id INTEGER PRIMARY KEY, alias TEXT NOT NULL, role_id TEXT NOT NULL, role_name TEXT NOT NULL, role_guild_id TEXT NOT NULL, expire_at TEXT, expire_task_id INTEGER, note TEXT, status TEXT',
    },
  ];

  await Promise.all(
    tables.map(t => {
      return dbCtrl.tableExists(MFBGB, MFBGB.db.subscribableRolesDB, t.name).then(exist => {
        if (!exist) {
          dbCtrl.createTable(MFBGB, MFBGB.db.subscribableRolesDB, t.name, t.query);
        }
      });
    })
  );

  MFBGB.BSDiscord.SubscribableRole.loadOngoingRoles();
};
