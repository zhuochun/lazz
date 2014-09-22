_ = require "lodash"

jade   = require "jade"
stylus = require "stylus"
coffee = require "coffee-script"
marked = require "marked"

markedCompiler =
  extnames: [".md", ".mkd", ".markdown"],
  runner: (file, { data, layout }, done) ->
    content = marked(file.content)
    if layout
      done null, layout(site: data, page: file, content: content)
    else
      done null, content

jadeCompiler =
  extnames: [".jade"],
  runner: (file, { data, layout }, done) ->
    content = jade.renderFile(file.__source, site: data, page: file)
    if layout
      done null, layout(site: data, page: file, content: content)
    else
      done null, content

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
