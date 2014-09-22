_ = require "lodash"
fs = require "fs-extra"
fm = require "front-matter"
rm = require("rimraf").sync
glob = require "glob"
path = require "path"
async = require "async"
jade = require "jade"
utils = require "./utils"
logger = require "./logger"
compilers = require "./compiler"

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
    meta:    {} # global data
    asset:   {} # assets
    file:    {} # files
    filter:  {} # jade filter functions
    page:    undefined # do not operate on this
    content: undefined # do not operate on this

  _storage:
    path:   [] # asset paths
    layout: {} # layouts

  _task:
    read:    [] # tasks to read files
    process: [] # tasks to process data

  _compilers: compilers
  _emptyCompiler: (file, data, layout, cb) ->
    cb(null, file, copy: true)

  ########################################
  # Public APIs
  ########################################

  # set configurations
  config: (config) ->
    _.extend(@_config, config)
    return this

  # add more meta data
  global: (data) ->
    if _.isPlainObject(data)
      _.extend(@_data.meta, data)
    else
      @_task.read.push(_.bind(@_readGlobal, @, data))
    return this

  # transform data and files
  # accept a function (data, done) -> {}
  # must call done after completion
  transform: (fn) ->
    @_task.process.push(_.bind(fn, undefined, @_data))
    return this

  # add jade filters
  # accept an object, e.g. { name: function }
  filter: (filter) ->
    _.extend(@_data.filter, filter)
    return this

  # add compilers
  # accept:
  #   - object, e.g. { extnames: [], runner: fun }
  #   - or an array of objects
  compiler: (compiler) ->
    # custom compilers are prepend at head
    # so it can overwrite default compilers
    if _.isArray(compiler)
      @_compilers = Array::concat.apply(compiler, @_compilers)
    else
      @_compilers.unshift(compiler)
    return this

  # add assets
  asset: (pattern, meta) ->
    @_task.read.push(_.bind(@_readAsset, @, pattern, meta))
    return this

  # add file types
  content: (type, pattern, meta) ->
    @_task.read.push(_.bind(@_read, @, type, pattern, meta))
    return this

  # add rest of files
  rest: (pattern, meta) ->
    @_task.read.push(_.bind(@_read, @, "rest", pattern, meta))
    return this

  # clean up destination directory
  clean: ->
    rm(@_config.destination)
    return this

  # output files
  thatsAll: ->
    stepRead = (done) =>
      async.parallel @_task.read, done

    stepProcess = (done) =>
      async.series @_task.process, done

    stepWrite = (done) =>
      types = _.map(@_data.file, (files) -> files)
      async.eachSeries types, _.bind(@_write, @), done

    async.series [stepRead, stepProcess, stepWrite], (error) ->
      if error then logger.error(error, "failed! T_T")
      else logger.success("done! :D")

  ########################################
  # Private APIs
  ########################################

  # read JSON files into data.meta
  _readGlobal: (pattern, done) ->
    readJSON = (file, cb) =>
      try
        @_data.meta[utils.keyname(file)] = fs.readJsonSync(@path_to(file))
      catch error
        logger.warn(error, "global.readJSON")
      cb(error)

    root = @path_to(".")
    glob pattern, cwd: root, (error, files) ->
      if error
        logger.error(error, "global", pattern)
        done(error)
      else
        async.each files, readJSON, done

  # read assets
  _readAsset: (pattern, meta, done) ->
    @_read "asset", pattern, meta, (error) =>
      if error
        logger.error(error, "asset", pattern)
      else
        for asset in @_data.file.asset
          @_data.asset[path.normalize(asset.__file)] = asset.path
          @_storage.path.push(path.dirname(asset.__file))
        @_storage.path = _.uniq(@_storage.path)
      done(error)

  # read files
  _read: (type, pattern, meta, done) ->
    root = @path_to(".")
    glob pattern, cwd: root, (error, files) =>
      if error
        logger.error(error, "content", pattern)
      else
        @_data.file[type] ?= []
        @_readFile(type, file, meta) for file in files
      done(error)

  # read a file and add attributes
  _readFile: (type, file, meta) ->
    return unless utils.isFile(@path_to(file))

    buffer = fs.readFileSync(@path_to(file))
    data = @_parseBuffer(buffer.toString(), meta)
    data.path = utils.fixPath(file)
    data.__file = file
    data.__source = @path_to(file)
    data.__extname = path.extname(file)

    @_data.file[type].push(data)

  # read file content
  _parseBuffer: (buffer, meta = {}) ->
    data = _.cloneDeep(meta)
    parsed = fm(buffer)
    _.extend(data, parsed.attributes)
    data.content = parsed.body
    return data

  # write out a list of files
  _write: (files, done) ->
    async.each files, _.bind(@_writeFile, @), done

  # write out a file
  _writeFile: (file, done) ->
    @_compile file, (error, content, options = {}) =>
      if options.copy
        fs.copy file.__source, file.path, done
      else
        fs.outputFile @dest_to(file.path), content, done

  # compile file content
  _compile: (file, done) ->
    compile = @_resolveCompiler(file.__extname)
    compile file,
      data: @_data,
      layout: @_resolveLayout(file.layout),
      storage: @_storage,
      options: @_config.options,
      done

  _resolveCompiler: (extname) ->
    for { extnames, runner } in @_compilers
      if extnames.indexOf(extname) != -1
        return runner
    return @_emptyCompiler

  _resolveLayout: (name) ->
    return unless name
    return @_storage.layout[name] if @_storage.layout[name]

    file = path.resolve(@_config.layout, "#{name}.jade")
    return @_storage.layout[name] = jade.compileFile(file)

  # resolve path based on source
  path_to: (file) ->
    path.resolve(@_config.source, file)

  # resolve path based on destination
  dest_to: (file) ->
    path.resolve(@_config.destination, file)

module.exports = new Lazz
