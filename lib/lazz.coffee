_ = require "lodash"
fs = require "fs-extra"
fm = require "front-matter"
rm = require("rimraf").sync
glob = require("glob").sync
path = require "path"

jade = require "jade"
stylus = require "stylus"
coffee = require "coffee-script"
marked = require "marked"

utils = require "./utils"
logger = require "./logger"

class Lazz
  _config:
    source: "./src/"
    destination: "./build/"
    layout: "./src/layout/"
    options:
      jade:   {}
      stylus: {}
      marked: {}
      coffee: {}

  _data:
    meta:   {} # global data
    file:   {} # files
    asset:  [] # asset paths
    filter: {} # filter functions for Jade

  _layouts: {} # cached layout

  _compilers: [
    {
      extnames: [".md", ".mkd", ".markdown"],
      runner: (file, data, layout, cb) ->
        file.content = marked(file.content)
        if layout
          cb(null, layout(site: data, page: file))
        else
          cb(null, file.content)
    },
    {
      extnames: [".jade"],
      runner: (file, data, layout, cb) ->
        cb(null, jade.renderFile(file.__source, site: data, page: file))
    },
    {
      extnames: [".coffee"],
      runner: (file, data, layout, cb) ->
        cb(null, coffee.compile(file.content, file.coffee))
    },
    {
      extnames: [".styl"],
      runner: (file, data, layout, cb) ->
        opts = filename: file.path, paths: data.asset
        stylus.render(file.content, opts, cb)
    }
  ]

  # just return the file content
  _emptyCompiler: (file, data, layout, cb) ->
    cb(null, file, copy: true)

  constructor: -> logger.info("Lazz", "Yap.")

  # set configurations
  config: (config) ->
    _.extend(@_config, config)
    return this

  # add additional data to data.meta
  global: (data) ->
    if _.isPlainObject(data)
      _.extend(@_data.meta, data)
    else
      @readGlobal(data)
    return this

  # read JSON files into data.meta
  readGlobal: (pattern) ->
    readJSON = (file) =>
      if utils.isJSON(file)
        @_data.meta[utils.keyname(file)] = fs.readJsonSync(@path_to(file))
      else
        logger.info("readGlobal", file, "is not a JSON file")

    root = @path_to(".")
    glob pattern, cwd: root, (error, files) ->
      if error
        logger.error("readGlobal", pattern, error)
      else
        readJSON(file) for file in files

    return this

  # transform data and files
  transform: (cb) -> cb(@_data)

  # add filters
  filter: (filter) ->
    _.extend(@_data.filter, filter)

  # add file types
  content: (type, pattern, meta) ->
    root = @path_to(".")
    console.log "root -> ", root
    glob pattern, cwd: root, (error, files) =>
      console.log "files -> ", files
      if error
        logger.error("content", pattern, error)
      else
        @_data.file[type] ?= []
        console.log "type [#{type}] -> ", @_data.file[type]
        @_read(type, file, meta) for file in files
        console.log "type [#{type}] after -> ", @_data.file[type]

    return this

  # rest of files
  rest: (pattern, meta) ->
    return @content("rest", pattern, meta)

  # assets
  asset: (pattern, meta) ->
    @_data.asset.push(path.dirname(pattern))
    return @content("asset", pattern, meta)

  # read file and add necessary attributes
  _read: (type, file, meta) ->
    return unless utils.isFile(@path_to(file))

    console.log "it is file at last"

    buffer = fs.readFileSync(@path_to(file))
    data = @_parse(buffer.toString(), meta)
    data.path = utils.fixPath(file)
    # special variables
    data.__source = @path_to(file)
    data.__extname = path.extname(file)

    @_data.file[type].push(data)

  # read file content
  _parse: (buffer, meta = {}) ->
    parsed = fm(buffer)
    data = _.cloneDeep(meta)
    _.extend(data, parsed.attributes)
    data.content = parsed.body
    return data

  # output files
  thatsAll: ->
    console.log "thatsAll -> ", @_data.file

    for type, files of @_data.file
      console.log type
      @_write(file) for file in files
    return this

  # write out file
  _write: (file) ->
    @_compile file, (error, content, options = {}) =>
      if options.copy
        fs.copy file.__source, file.path, (error) ->
          if (error)
            logger.error("copy", file.__source, error)
          else
            logger.success("copied", file.__source)
      else
        fs.outputFile @dest_to(file.path), content, (error) ->
          if (error)
            logger.error("output", file.__source, error)
          else
            logger.success("processed", file.__source)

  # compile file content
  _compile: (file, cb) ->
    compile = @_resolveCompiler(file.__extname)
    compile(file, @_data, @_resolveLayout(file.layout), cb)

  _resolveCompiler: (extname) ->
    for { extnames, runner } in @_compilers
      if extnames.indexOf(extname) != -1
        return runner
    return @_emptyCompiler

  _resolveLayout: (layout) ->
    return unless layout
    return @_layouts[layout] if @_layouts[layout]
    file = path.resolve(@_config.layout, "#{layout}.jade")
    return @_layouts[layout] = jade.compileFile(file)

  # clean up
  clean: -> rm(@_config.destination)

  # resolve path based on source
  path_to: (file) ->
    path.resolve(@_config.source, file)

  # resolve path based on destination
  dest_to: (file) ->
    path.resolve(@_config.destination, file)

module.exports = new Lazz
