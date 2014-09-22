var chalk,
  __slice = [].slice;

chalk = require("chalk");

module.exports = {
  log: function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return console.log(chalk.gray.apply(void 0, args));
  },
  info: function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return console.log(chalk.blue.apply(void 0, args));
  },
  success: function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return console.log(chalk.green.apply(void 0, args));
  },
  error: function() {
    var args, error;
    error = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return console.log(chalk.bgYellow.red.apply(void 0, args), " =>", chalk.red(error.message));
  },
  warn: function() {
    var args, error;
    error = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return console.log(chalk.magenta.apply(void 0, args), " =>", chalk.magenta(error.message));
  }
};
