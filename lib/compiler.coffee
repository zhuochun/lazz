_ = require "lodash"

jade   = require "jade"
stylus = require "stylus"
coffee = require "coffee-script"
marked = require "marked"

markedCompiler =
  extnames: [".md", ".mkd", ".markdown"],
  runner: (file, { data, layout }, done) ->
    file._content = marked(file.content)
    if layout
      data.page = file
      data.content = file._content
      done null, layout(data)
    else
      done null, file._content

jadeCompiler =
  extnames: [".jade"],
  runner: (file, { data, layout }, done) ->
    data.page = file
    data.content = undefined
    file._content = jade.renderFile(file.__source, data)
    if layout
      data.content = file._content
      done null, layout(data)
    else
      done null, file._content

stylusCompiler =
  extnames: [".styl"],
  runner: (file, { data, storage }, done) ->
    opts = filename: file.path, paths: storage.path
    stylus.render(file.content, opts, done)

coffeeCompiler =
  extnames: [".coffee"],
  runner: (file, { data, options }, done) ->
    done(null, coffee.compile(file.content, options))

module.exports = [
  jadeCompiler,
  stylusCompiler,
  coffeeCompiler,
  markedCompiler
]
