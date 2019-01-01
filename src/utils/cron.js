const units  = require('./units');
const Schema = require('../schema');
const _      = require('lodash');
const logger = require('./logger');

/**
 * Simple setInterval wrappre
 *
 * @export
 * @class Task
 */
class Task {

  constructor(name, fn, interval) {
    if (!_.isFinite(interval) || interval < 0) {
      throw `Invalid timeout interval ${interval}`;
    }

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

  async runOnce() {
    if (_.isFunction(this.fn)) {
      this.fn();
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

const TASKS = [];

module.exports = {
  every(val, unit) {
    return {
      do: (name, fn) => {
        const task = new Task(name, fn, val * units[unit]());
        TASKS.push(task);
        return task;
      }
    }
  },

  stopAll() {
    _.each(TASKS, t => t.stop());
  }
};
