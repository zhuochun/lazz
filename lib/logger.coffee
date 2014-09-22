chalk = require "chalk"

module.exports =
  info: (title, msg) ->
    chalk.white "[#{title}]: #{msg}"
  success: (title, msg) ->
    chalk.green "[#{title}]: #{msg}"
  error: (title, info, e) ->
    chalk.bold.red "[#{title}]: #{info} - #{e.message}"
