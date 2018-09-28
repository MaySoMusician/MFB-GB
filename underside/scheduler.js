const sqlite3 = require('sqlite3'),
      sch = require('node-schedule'),
      moment = require('moment'),
      dbCtrl = require('./dbCtrl.js'),
      path = require('path');
require("moment-duration-format");

module.exports = async (MFBGB) => {
  MFBGB.Scheduler = {
    scheduledTasks: new Map()
  }

  //MFBGB.scheduledTasks = new Map();
  if(!MFBGB.db) MFBGB.db = {};
  MFBGB.db.schedulerDB = await dbCtrl.openDatabase(MFBGB, path.resolve(__dirname, '../data/db/scheduler.db'));
  MFBGB.db.schedulerDB.serialize(); // Calling this with no parameter causes the database to set its execution mode to 'serialize'

  const contextReady = require('./scheduler-contextReady.js')(MFBGB);

  const tasks = require('./scheduler-tasks.js')(MFBGB);

  const taskWrapper = (id, context = 'none', cmd, params, note, postStatus = 'done', delayed = false) => {
    if(!contextReady[context].check) {
      contextReady[context].planB(id, context, cmd, params, note, postStatus, delayed);
      MFBGB.Logger.log(`|Scheduler| Didn't execute the task (${id}) due to unready context: ${context}`);
      return false;
    }
    MFBGB.Logger.log(`|Scheduler| Started the task (${id}) ${delayed ? 'belately': 'punctually'} with the context of ${context}`);
    MFBGB.Logger.debug(`cmd: ${cmd}, params: ${params}, note: ${note}, postStatus: ${postStatus}, delayed: ${delayed}`);

    let result = tasks[cmd](params);

    if(result) {
      MFBGB.Logger.log(`|Scheduler| Successfully finished the task (${id})`);
    } else {
      MFBGB.Logger.warn(`|Scheduler| It seemed to fail in the task (${id})`);
      postStatus = postStatus + '-failed';
      MFBGB.Logger.debug(`|Scheduler| Set 'postStatus' to ${postStatus} on a trial basis`);
    }
    
    MFBGB.Scheduler.setStatusById(id, postStatus, 'both').then(() => {
      MFBGB.Logger.log(`|Scheduler| Set the status of the task (${id}) to ${postStatus}`);
    }).catch(err => {
      MFBGB.Logger.error(`|Scheduler| Couldn't set the status of the task (${id}): ${err}`);
    });
    MFBGB.Scheduler.scheduledTasks.delete(id);
    return result;
  };

  const isDefinedTable = tableName => (tableName === 'delayable_tasks' || tableName === 'time_critical_tasks');
  
  MFBGB.Scheduler.regiterTask = async (dateRunAt, context, cmd, params, note, secondsDelayedFor) => {
    let id = parseInt(moment().format('YYMMDDHHmmss') + MFBGB.random(0, 99).toString().padStart(2, '0')),
        task = await MFBGB.Scheduler.getTaskById(id, 'both');
    if(task) {
      let err = `The id '${id}' has been used for another task - tasks can't exist with the same id as another task`;
      //MFBGB.Logger.error(`|Scheduler| ${err}`);
      return Promise.reject(new Error(err));
    }
    
    let isDelayable = secondsDelayedFor !== null,
        type = isDelayable ? 'delayable' : 'time-critical',
        strRunAt = moment(dateRunAt).format('YYYY-MM-DD HH:mm:ss'),
        job = sch.scheduleJob(dateRunAt, taskWrapper.bind(null, id, context, cmd, params, note, 'done', false));
    
    MFBGB.Scheduler.scheduledTasks.set(id, job);
    MFBGB.Logger.log(`|Scheduler| Registered the ${type} task (${id}) to the MFBGB Scheduler (in-memory dataset)`);
    
    let paramsJson = JSON.stringify(params),
        insertStatement,
        insertArgs,
        tableName = isDelayable ? 'delayable_tasks' : 'time_critical_tasks';
    
    if(isDelayable) {
      insertStatement = 'INSERT INTO delayable_tasks(id, run_at, context, cmd, params, note, delayed_for) VALUES($id, $run_at, $context, $cmd, $params, $note, $delayed_for)';
      insertArgs = {
        $id: id,
        $run_at: strRunAt,
        $context: context,
        $cmd: cmd,
        $params: paramsJson,
        $note: note,
        $delayed_for: secondsDelayedFor
      };
    } else {
      insertStatement = 'INSERT INTO time_critical_tasks(id, run_at, context, cmd, params, note) VALUES($id, $run_at, $context, $cmd, $params, $note)';
      insertArgs = {
        $id: id,
        $run_at: strRunAt,
        $context: context,
        $cmd: cmd,
        $params: paramsJson,
        $note: note
      };
    }
    
    return new Promise((resolve, reject) => {
      MFBGB.db.schedulerDB.run(
        insertStatement,
        insertArgs,
        err => {
          if(err) {
            MFBGB.Logger.error(`|Scheduler| Couldn't register the task (${id}) in the ${tableName} table: ${err}`);
            reject(err);
          }
          MFBGB.Logger.log(`|Scheduler| Successfully registered the task (${id}) in the ${tableName} table`);
          resolve(id);
        }
      );
    });
  };

  MFBGB.Scheduler.getTaskById = async (id, from = 'both') => {
    if(isDefinedTable(from)) {
      return new Promise((resolve, reject) => {
        MFBGB.db.schedulerDB.get(
          `SELECT * FROM ${from} WHERE id = $id`,
          { $id: id },
          (err, res) => {
            if(err) {
              console.error(err);
              reject(err);
            }
            if(res) res.params = JSON.parse(res.params);
            resolve(res);
          }
        )
      })
    } else {
      return MFBGB.Scheduler.getTaskById(id, 'delayable_tasks').then(task => {
        if(task) return task;
        else return MFBGB.Scheduler.getTaskById(id, 'time_critical_tasks');
      });
    }
  };

  MFBGB.Scheduler.setStatusById = async (id, status, from = 'both') => {
    let task = await MFBGB.Scheduler.getTaskById(id, from);
    if(!task) {
      let err = `The task (${id}) isn't registered in ${ isDefinedTable(from) ? `the ${from} table` : 'neither of the tables' }`;
      //MFBGB.Logger.error(`|Scheduler| ${err}`);
      return Promise.reject(new Error(err));
    }

    if(!isDefinedTable(from)) from = (typeof task.delayed_for !== 'undefined') ? 'delayable_tasks' : 'time_critical_tasks';

    return new Promise((resolve, reject) => {
      MFBGB.db.schedulerDB.run(
        `UPDATE ${from} SET status = $status WHERE id = $id`,
        { $status: status, $id: id },
        err => {
          if(err) reject(err);
          resolve();
        }
      );
    });
  };

  MFBGB.Scheduler.loadTaskById = async (id, from = 'both') => {
    let task = await MFBGB.Scheduler.getTaskById(id, from);
    if(!task) {
      let err = `The task (${id}) isn't registered in ${ isDefinedTable(from) ? `the ${from} table` : 'neither of the tables' }`;
      //MFBGB.Logger.error(err);
      //return Promise.reject(new Error(err));
      throw new Error(err);
    }

    if(!isDefinedTable(from)) from = (typeof task.delayed_for !== 'undefined') ? 'delayable_tasks' : 'time_critical_tasks';

    let isDelayable = from === 'delayable_tasks',
        type = isDelayable ? 'delayable' : 'time-critical';

    if(MFBGB.Scheduler.scheduledTasks.has(id)) {
      let err = `The ${type} task (${id}) has been loaded - tasks can't be loaded more than once`;
      throw new Error(err);
      //MFBGB.Logger.error(err);
      //return Promise.reject(new Error(err));
    }

    if(task.status === 'done') {
      let err = `The ${type} task (${id}) has been finished - tasks can't be executed more than once`;
      throw new Error(err);
      //MFBGB.Logger.error(err);
      //return Promise.reject(new Error(err));
    }

    let momentNow = moment(),
        momentRunAt = moment(task.run_at);
    //momentReRunBy = momentRunAt.clone().add(task.delayed_for, 's');

    if(momentRunAt.isSameOrBefore(momentNow)) {
      MFBGB.Logger.warn(`|Scheduler| The ${type} task (${id}) has expired`);
      if(isDelayable) {
        let momentReRunBy = momentRunAt.clone().add(task.delayed_for, 's');
        if(task.delayed_for === 0 || momentReRunBy.isAfter(momentNow)) {
          taskWrapper(id, task.context, task.cmd, task.params, task.note, 'delayed', true);
        } else {
          MFBGB.Scheduler.setStatusById(id, 'expired', 'delayable_tasks');
        }
      } else {
        MFBGB.Scheduler.setStatusById(id, 'expired', 'time_critical_tasks');
      }
      return;
    }

    let job = sch.scheduleJob(task.run_at, taskWrapper.bind(null, id, task.context, task.cmd, task.params, task.note, 'done', false));
    
    MFBGB.Scheduler.scheduledTasks.set(id, job);
    MFBGB.Logger.log(`|Scheduler| Re-registered the ${type} task (${id}) to the MFBGB Scheduler (in-memory dataset)`);
  };
  
  MFBGB.Scheduler.deleteTaskById = async (id, from = 'both', reason = '') => {
    let task = await MFBGB.Scheduler.getTaskById(id, from);
    if(!task) {
      let err = `The task (${id}) isn't registered in ${ isDefinedTable(from) ? `the ${from} table` : 'neither of the tables' }`;
      throw new Error(err);
    }

    if(!isDefinedTable(from)) from = (typeof task.delayed_for !== 'undefined') ? 'delayable_tasks' : 'time_critical_tasks';

    let isDelayable = from === 'delayable_tasks',
        type = isDelayable ? 'delayable' : 'time-critical';
    
    if(!MFBGB.Scheduler.scheduledTasks.has(id)) {
      let err = `The ${type} task (${id}) isn't loaded - tasks which aren't loaded can't be deleted`;
      throw new Error(err);
    }

    if(task.status !== null) {
      let err = `The ${type} task (${id}) has seemed to be executed ('${task.status}') - tasks which has already done can't be deleted`;
      throw new Error(err);
    }
    
    MFBGB.Scheduler.scheduledTasks.get(task.id).cancel();
    MFBGB.Scheduler.scheduledTasks.delete(task.id);
    MFBGB.Logger.log(`|Scheduler| Successfully canceled the job of the ${type} task (${id}), and deleted it from the MFBGB Scheduler (in-memory dataset)`);
    
    MFBGB.Scheduler.setStatusById(id, 'deleted', from).then(() => {
      MFBGB.Logger.log(`|Scheduler| Set the status of the ${type} task (${id}) for 'deleted'`);
    }).catch(err => {
      MFBGB.Logger.error(`|Scheduler| Couldn't set the status of the ${type} task (${id}): ${err}`);
    });
  }
  
  MFBGB.Scheduler.loadUnfinishedTasks = async () => {
    MFBGB.db.schedulerDB.parallelize(() => {
      MFBGB.db.schedulerDB.each(
        'SELECT id FROM delayable_tasks WHERE status IS NULL',
        {},
        (err, row) => {
          if(err) {
            MFBGB.Logger.error(`|Scheduler| An error occurred during loading unfinished tasks from the delayable_tasks table: ${err}`);
            return;
          }
          
          MFBGB.Scheduler.loadTaskById(row.id, 'delayable_tasks');
        }
      );
      
      MFBGB.db.schedulerDB.each(
        'SELECT id FROM time_critical_tasks WHERE status IS NULL',
        {},
        (err, row) => {
          if(err) {
            MFBGB.Logger.error(`|Scheduler| An error occurred during loading unfinished tasks from the time_critical_tasks table: ${err}`);
            return;
          }

          MFBGB.Scheduler.loadTaskById(row.id, 'time_critical_tasks');
        }
      );
    });
  };
  
  const tables = [
    {
      name: 'delayable_tasks',
      query: 'id INTEGER PRIMARY KEY, run_at TEXT NOT NULL, context TEXT NOT NULL, cmd TEXT NOT NULL, params TEXT, note TEXT, delayed_for INTEGER NOT NULL, status TEXT'
    },
    {
      name: 'time_critical_tasks',
      query: 'id INTEGER PRIMARY KEY, run_at TEXT NOT NULL, context TEXT NOT NULL, cmd TEXT NOT NULL, params TEXT, note TEXT, status TEXT'
    }
  ];
  
  await Promise.all(
    tables.map(t => {
      return dbCtrl.tableExists(MFBGB, MFBGB.db.schedulerDB, t.name).then(exist => {
        if(!exist) {
          dbCtrl.createTable(MFBGB, MFBGB.db.schedulerDB, t.name, t.query);
        }
      });
    })
  );
  
  MFBGB.Scheduler.loadUnfinishedTasks();
}