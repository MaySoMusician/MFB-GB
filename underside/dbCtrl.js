/* eslint-disable one-var */
const sqlite3 = require('sqlite3'),
      fse = require('fs-extra'),
      path = require('path');

const openDatabase = (client, name) => {
  let dir = path.parse(name).dir;
  return fse.ensureDir(dir).then(() => {
    client.Logger.log(`|Underside| Directory preparation for a database '${name}' looks successful`);
    return new sqlite3.Database(name, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, err => {
      if (err) {
        client.Logger.error(`|Underside| Couldn't open or create a database '${name}': ${err}`);
        console.error(err);
      } else client.Logger.log(`|Underside| Successfully opened or created a database '${name}'`);
    });
  }).catch(err => {
    client.Logger.error(`|Underside| Couldn't prepare directories for a database '${name}': ${err}`);
    console.error(err);
  });
};

const closeDatabase = (client, database) => {
  return new Promise((resolve, reject) => {
    try {
      database.close();
      client.Logger.log(`|Underside| Successfully closed a database '${database.filename}'`);
      resolve();
    } catch (ex) {
      client.Logger.error(`|Underside| Couldn't open/create a database '${database.filename}': ${ex}`);
      console.error(ex);
      reject(ex);
    }
  });
};

const tableExists = (client, database, tableName) => {
  return new Promise((resolve, reject) => {
    database.get(
      'SELECT count(*) FROM sqlite_master WHERE type = "table" AND name = $name',
      {$name: tableName},
      (err, res) => {
        if (err) {
          client.Logger.error(`|Underside| Couldn't check if a table named '${tableName}' exists: ${err}`);
          reject(err);
        }
        let exist = (res['count(*)'] > 0);
        client.Logger.log(`|Underside| A table named '${tableName}' ${exist ? 'already exists' : 'doesn\'t exist'} in '${database.filename}'`);
        resolve(exist);
      }
    );
  });
};

const createTable = (client, database, tableName, columnQuery) => {
  return new Promise((resolve, reject) => {
    database.run(
      `CREATE TABLE ${tableName}(${columnQuery})`,
      err => {
        if (err) {
          client.Logger.error(`|Underside| Couldn't create a table named '${tableName}' in '${database.filename}': ${err}`);
          reject(err);
        }
        client.Logger.log(`|Underside| Successfully created a table named '${tableName}' in '${database.filename}'`);
        resolve();
      }
    );
  });
};

module.exports = {
  openDatabase: openDatabase,
  closeDatabase: closeDatabase,
  tableExists: tableExists,
  createTable: createTable,
};
