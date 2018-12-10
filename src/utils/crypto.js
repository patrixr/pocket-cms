const bcrypt = require("bcrypt")

const SALT_ROUNDS = 3;

module.exports = {
  async hash(pw) {
    return bcrypt.hash(pw, SALT_ROUNDS)
  },

  async compare(pw, hash) {
    return bcrypt.compare(pw, hash);
  }
}