var Lazz, async, compilers, fm, fs, glob, jade, logger, path, rm, utils, _;

_ = require("lodash");

fs = require("fs-extra");

fm = require("front-matter");

rm = require("rimraf").sync;

glob = require("glob");

path = require("path");

async = require("async");

jade = require("jade");

utils = require("./utils");

logger = require("./logger");

compilers = require("./compiler");

Lazz = (function() {
  function Lazz() {}

  Lazz.prototype._config = {
    source: "./src/",
    destination: "./build/",
    layout: "./src/layout/",
    options: {
      jade: {},
      stylus: {},
      marked: {},
      coffee: {}
    }
  };

  Lazz.prototype._data = {
    site: {},
    file: {},
    asset: {}
  };

  Lazz.prototype._storage = {
    path: [],
    layout: {}
  };

  Lazz.prototype._task = {
    read: [],
    process: []
  };

  Lazz.prototype._compilers = compilers;

  Lazz.prototype._emptyCompiler = function(file, __, done) {
    return done(void 0, void 0, {
      copy: true
    });
  };

  Lazz.prototype.config = function(config) {
    _.extend(this._config, config);
    return this;
  };

  Lazz.prototype.global = function(data) {
    if (_.isPlainObject(data)) {
      _.extend(this._data.site, data);
    } else {
      this._task.read.push(_.bind(this._readGlobal, this, data));
    }
    return this;
  };

  Lazz.prototype.process = function(fn) {
    this._task.process.push(_.bind(fn, void 0, this._data));
    return this;
  };

  Lazz.prototype.helper = function(name, fn) {
    this._data["$" + name] = _.bind(fn, this._data);
    return this;
  };

  Lazz.prototype.compiler = function(compiler) {
    if (_.isArray(compiler)) {
      this._compilers = Array.prototype.concat.apply(compiler, this._compilers);
    } else {
      this._compilers.unshift(compiler);
    }
    return this;
  };

  Lazz.prototype.asset = function(pattern, meta) {
    this._task.read.push(_.bind(this._readAsset, this, pattern, meta));
    return this;
  };

  Lazz.prototype.content = function(type, pattern, meta) {
    this._task.read.push(_.bind(this._read, this, type, pattern, meta));
    return this;
  };

  Lazz.prototype.rest = function(pattern, meta) {
    this._task.read.push(_.bind(this._read, this, "rest", pattern, meta));
    return this;
  };

  Lazz.prototype.clean = function() {
    rm(this._config.destination);
    return this;
  };

  Lazz.prototype.thatsAll = function() {
    var stepProcess, stepRead, stepWrite;
    stepRead = (function(_this) {
      return function(done) {
        return async.parallel(_this._task.read, done);
      };
    })(this);
    stepProcess = (function(_this) {
      return function(done) {
        return async.series(_this._task.process, done);
      };
    })(this);
    stepWrite = (function(_this) {
      return function(done) {
        var types;
        types = _.map(_this._data.file, function(files) {
          return files;
        });
        return async.eachSeries(types, _.bind(_this._write, _this), done);
      };
    })(this);
    return async.series([stepRead, stepProcess, stepWrite], function(error) {
      if (error) {
        return logger.error(error, "failed! T_T");
      } else {
        return logger.success("done! :D");
      }
    });
  };

  Lazz.prototype._readGlobal = function(pattern, done) {
    var readJSON;
    readJSON = (function(_this) {
      return function(file, cb) {
        var error;
        try {
          _this._data.site[utils.keyname(file)] = fs.readJsonSync(_this.path_to(file));
        } catch (_error) {
          error = _error;
          logger.warn(error, "global.readJSON");
        }
        return cb(error);
      };
    })(this);
    return glob(pattern, {
      cwd: this.path_to(".")
    }, function(error, files) {
      if (error) {
        logger.error(error, "global", pattern);
        return done(error);
      } else {
        return async.each(files, readJSON, done);
      }
    });
  };

  Lazz.prototype._readAsset = function(pattern, meta, done) {
    return this._read("asset", pattern, meta, (function(_this) {
      return function(error) {
        var asset, _i, _len, _ref;
        if (error) {
          logger.error(error, "asset", pattern);
        } else {
          _ref = _this._data.file.asset;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            asset = _ref[_i];
            _this._data.asset[path.normalize(asset.__file)] = asset.path;
            _this._storage.path.push(path.dirname(asset.__file));
          }
          _this._storage.path = _.uniq(_this._storage.path);
        }
        return done(error);
      };
    })(this));
  };

  Lazz.prototype._read = function(type, pattern, meta, done) {
    return glob(pattern, {
      cwd: this.path_to(".")
    }, (function(_this) {
      return function(error, files) {
        var file, _base, _i, _len;
        if (error) {
          logger.error(error, "content", pattern);
        } else {
          if ((_base = _this._data.file)[type] == null) {
            _base[type] = [];
          }
          for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            _this._readFile(type, file, meta);
          }
        }
        return done(error);
      };
    })(this));
  };

  Lazz.prototype._readFile = function(type, file, meta) {
    var buffer, data;
    if (!utils.isFile(this.path_to(file))) {
      return;
    }
    buffer = fs.readFileSync(this.path_to(file));
    data = this._parseBuffer(buffer.toString(), meta);
    data.path = utils.fixPath(file);
    data.__file = file;
    data.__source = this.path_to(file);
    data.__extname = path.extname(file);
    return this._data.file[type].push(data);
  };

  Lazz.prototype._parseBuffer = function(buffer, meta) {
    var data, parsed;
    if (meta == null) {
      meta = {};
    }
    data = _.cloneDeep(meta);
    parsed = fm(buffer);
    _.extend(data, parsed.attributes);
    data.content = parsed.body;
    return data;
  };

  Lazz.prototype._write = function(files, done) {
    return async.each(files, _.bind(this._writeFile, this), done);
  };

  Lazz.prototype._writeFile = function(file, done) {
    return this._compile(file, (function(_this) {
      return function(error, content, options) {
        if (options == null) {
          options = {};
        }
        if (options.copy) {
          return fs.copy(file.__source, file.path, done);
        } else {
          return fs.outputFile(_this.dest_to(file.path), content, done);
        }
      };
    })(this));
  };

  Lazz.prototype._compile = function(file, done) {
    var compile;
    compile = this._resolveCompiler(file.__extname);
    return compile(file, {
      data: this._data,
      layout: this._resolveLayout(file.layout),
      storage: this._storage,
      options: this._config.options
    }, done);
  };

  Lazz.prototype._resolveCompiler = function(extname) {
    var extnames, runner, _i, _len, _ref, _ref1;
    _ref = this._compilers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      _ref1 = _ref[_i], extnames = _ref1.extnames, runner = _ref1.runner;
      if (extnames.indexOf(extname) !== -1) {
        return runner;
      }
    }
    return this._emptyCompiler;
  };

  Lazz.prototype._resolveLayout = function(name) {
    var file;
    if (!name) {
      return;
    }
    if (this._storage.layout[name]) {
      return this._storage.layout[name];
    }
    file = path.resolve(this._config.layout, "" + name + ".jade");
    return this._storage.layout[name] = jade.compileFile(file);
  };

  Lazz.prototype.path_to = function(file) {
    return path.resolve(this._config.source, file);
  };

  Lazz.prototype.dest_to = function(file) {
    return path.resolve(this._config.destination, file);
  };

  return Lazz;

})();

module.exports = new Lazz;
