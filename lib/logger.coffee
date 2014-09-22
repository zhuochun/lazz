chalk = require "chalk"

module.exports =
  log: (args...) ->
    console.log chalk.gray.apply(undefined, args)
  info: (args...) ->
    console.log chalk.blue.apply(undefined, args)
  success: (args...) ->
    console.log chalk.green.apply(undefined, args)
  error: (error, args...) ->
    console.log chalk.bgYellow.red.apply(undefined, args),
      " =>", chalk.red(error.message),
  warn: (error, args...) ->
    console.log chalk.magenta.apply(undefined, args),
      " =>", chalk.magenta(error.message),
