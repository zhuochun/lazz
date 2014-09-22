var chalk;

chalk = require("chalk");

module.exports = {
  info: function(position, msg) {
    return chalk.white("[" + position + "]: " + msg);
  },
  error: function(position, info, e) {
    return chalk.bold.red("[" + position + "]: " + info + " - " + e.message);
  },
  success: function(position, msg) {
    return chalk.green("[" + position + "]: " + msg);
  }
};
