const units  = require('./units');
const Schema = require('../schema');
const _      = require('lodash');
const logger = require('./logger');


module.exports = function (pocket) {

  const tasksSchema = new Schema({
    additionalProperties: false,
    fields: {
      task: {
        type: 'string',
        index: {
          unique: true
        }
      },
      locked: 'boolean'
    }
  });

  const tasks = pocket.resource('_tasks', tasksSchema);

  /**
   * Simple setInterval wrappre
   *
   * @export
   * @class Task
   */
  class Task {

    constructor(name, fn, interval, opts = {}) {
      if (!_.isFinite(interval) || interval < 0) {
        throw `Invalid timeout interval ${interval}`;
      }

      this.requireLock = opts.requireLock;
      this.name = name;
      this.fn = fn;
      this.interval = interval;
      this.ref = null;

      this.fn = async () => {
        try {
          logger.info(`[CRON] Running '${name}'`);
          await fn();
        } catch (e) {
          logger.error(`[CRON] Error running '${name}'`);
          logger.error(e);
        }
      };
    }

    static every(val, unit) {
      return {
        do: (name, fn) => {
          return new Task(name, fn, val * units[unit](), false);
        },
        perNode: {
          do: (name, fn) => {
            return new Task(name, fn, val * units[unit](), true);
          }
        }
      }
    }

    async runOnce() {
      let record = await tasks.findOne({ task: this.name });
      if (!record) {
        record = await tasks.create({
          task: this.name,
          locked: false
        });
      }

      if (this.requireLock && record.locked) {
        return;
      }

      if (_.isFunction(this.fn)) {
        if (!this.oncePerCluster) {
          return await this.fn();
        }

        await tasks.mergeOne(record._id, { locked: true });
        await this.fn();
        await tasks.mergeOne(record._id, { locked: false });
      }
    }

    start() {
      if (this.ref) {
        return;
      }
      this.runOnce();
      this.ref = setInterval(() => this.runOnce(), this.interval);
    }

    stop() {
      if (!this.ref) {
        return;
      }
      clearInterval(this.ref);
      this.ref = null;
    }
  }

  return Task;
}