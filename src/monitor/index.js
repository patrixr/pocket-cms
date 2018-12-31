const _           = require('lodash');
const express     = require('express');
const system      = require('systeminformation');
const Schema      = require('../schema');
const Cache       = require('../utils/cache');
const {
  convert,
  days
} = require('../utils/units');
const {
  FORBIDDEN
} = require('../utils/errors');

/**
 * Express middleware to create monitoring endpoints
 *
 * @export
 */
module.exports = function (pocket) {
  const router = new express.Router();

  // -----
  //  SETUP RESOURCE
  // -----
  const sysStats = pocket.resource('_usage', new Schema({
    fields: {
      machineId: {
        type: 'string'
      },
      machineInfo: {
        type: 'map',
        items: {
          type: 'string'
        }
      },
      stats: {
        type: 'map',
        items: {
          type: 'object',
          schema: new Schema({
            fields: {
              values: 'map',
              unit: 'string'
            }
          })
        }
      }
    }
  }));

  // -----
  //  SETUP MONITORING TASK
  // -----

  const getMachineId = Cache.once(async () => {
    const sys = await system.system();
    return sys.uuid;
  });

  const getMachineInfo = Cache.once(async () => {
    const [ cpu, mem, os, disks, mid ]  = await Promise.all([
      system.cpu(),
      system.mem(),
      system.osInfo(),
      system.fsSize(),
      getMachineId()
    ]);

    const output = {
      'Hostname': os.hostname,
      'Machine ID': mid,
      'CPU Cores': `${cpu.cores} cores`,
      'CPU Max speed':`${cpu.speedmax} GHz`,
      'Total Memory': `${convert.to.gigabytes(mem.total).toFixed(1)} GB`
    };

    _.each(disks, (d) => {
      output[`Disk size (${d.mount})`] = `${convert.to.gigabytes(d.size).toFixed(1)} GB`
    });

    return output;
  });

  const getLiveStats = async () => {
    const [ cpuLoad, mem ] = await Promise.all([
      system.currentLoad(),
      system.mem()
    ]);

    let output = {
      "CPU Usage": {
        values: {
          'total': cpuLoad.currentload,
          'user': cpuLoad.currentload_user,
          'sytem': cpuLoad.currentload_system
        },
        unit: '%'
      },
      "Memory usage": {
        values: {
          'Current': convert.to.gigabytes(mem.used).toFixed(1),
          'Total': convert.to.gigabytes(mem.total).toFixed(1),
        },
        unit: 'GB'
      }
    };
    return output;
  };

  const cron = pocket.cron.every(5, 'minutes').perNode.do('Server monitoring routine', async () => {
    await sysStats.remove({
      _createdAt: { $lte: Date.now() - days(3) }
    });


    const [ machineInfo, liveStats, mid ] = await Promise.all([
      getMachineInfo(),
      getLiveStats(),
      getMachineId()
    ]);

    await sysStats.create({
      machineId:    mid,
      machineInfo:  machineInfo,
      stats:        liveStats
    });
  });

  cron.start();

  // -----
  //  SETUP ROUTES
  // -----

  router.get('/stats', async (req, res, next) => {
    const user    = _.get(req, "ctx.user");

    if (!user || !user.isAdmin()) {
      return FORBIDDEN.send(res);
    }

    const records   = _.sortBy(await sysStats.findAll(), ['_createdAt']);
    const machines  = {};

    _.each(records, (record) => {
      machines[record.machineId] = machines[record.machineId] || {
        machineId: record.machineId,
        machineInfo: {},
        records: []
      };
      let m = machines[record.machineId];
      m.machineInfo = record.machineInfo;
      m.records.push(_.omit(record, 'machineId', 'machineInfo'));
    });

    res.json(_.map(machines, _.id));
  });

  return router;
}