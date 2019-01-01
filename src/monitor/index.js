const _           = require('lodash');
const express     = require('express');
const system      = require('systeminformation');
const Schema      = require('../schema');
const Cache       = require('../utils/cache');
const env         = require('../utils/env');
const {
  convert,
  minutes,
  days
} = require('../utils/units');
const {
  FORBIDDEN
} = require('../utils/errors');

const PING_INTERVAL = minutes(5);

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
  const processes = pocket.resource('_processes', new Schema({
    fields: {
      machineId: {
        type: 'string',
        required: true
      },
      pid: {
        type: 'number',
        required: true
      },
      uptime: {
        type: 'number',
        required: true
      },
      lastPing: {
        type: 'timestamp',
        required: true
      },
      ram: {
        type: 'number',
        required: true
      },
      alive: {
        type: 'boolean',
        computed: true,
        compute(process) {
          return Date.now() - process.lastPing < PING_INTERVAL + minutes(2);
        }
      },
      machineInfo: {
        type: 'map',
        items: {
          type: 'string'
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

  const cron = pocket.cron.every(5, 'minutes').do('Process pinging', async () => {
    const pid     = process.pid;
    const uptime  = Math.floor(process.uptime());
    const [
      machineInfo,
      machineId
    ]  = await Promise.all([
      getMachineInfo(),
      getMachineId()
    ]);

    await processes.upsertOne({ machineId, pid }, {
      machineId,
      pid,
      machineInfo,
      uptime,
      lastPing: Date.now(),
      ram: convert.to.megabytes(process.memoryUsage().heapTotal)
    });
    await processes.remove({ _updatedAt: { $lte: Date.now() - days(3) } })
  });

  if (env() !== "test") {
    cron.start();
  }

  return router;
}