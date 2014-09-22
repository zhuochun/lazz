var Lazz, coffee, fm, fs, glob, jade, logger, marked, path, rm, stylus, utils, _;

_ = require("lodash");

fs = require("fs-extra");

fm = require("front-matter");

rm = require("rimraf").sync;

glob = require("glob").sync;

path = require("path");

jade = require("jade");

stylus = require("stylus");

coffee = require("coffee-script");

marked = require("marked");

utils = require("./utils");

logger = require("./logger");

Lazz = (function() {
  Lazz.prototype._config = {
    source: "./src/",
    destination: "./build/",
    layout: "./src/layout/"
  };

  Lazz.prototype._data = {
    meta: {},
    file: {},
    asset: [],
    filter: {}
  };

  Lazz.prototype._layouts = {};

  Lazz.prototype._compilers = [
    {
      extnames: [".md", ".mkd", ".markdown"],
      runner: function(file, data, layout, cb) {
        file.content = marked(file.content);
        if (layout) {
          return cb(null, layout({
            site: data,
            page: file
          }));
        } else {
          return cb(null, file.content);
        }
      }
    }, {
      extnames: [".jade"],
      runner: function(file, data, layout, cb) {
        return cb(null, jade.renderFile(file.__source, {
          site: data,
          page: file
        }));
      }
    }, {
      extnames: [".coffee"],
      runner: function(file, data, layout, cb) {
        return cb(null, coffee.compile(file.content, file.coffee));
      }
    }, {
      extnames: [".styl"],
      runner: function(file, data, layout, cb) {
        var opts;
        opts = {
          filename: file.path,
          paths: data.asset
        };
        return stylus.render(file.content, opts, cb);
      }
    }
  ];

  Lazz.prototype._emptyCompiler = function(file, data, layout, cb) {
    return cb(null, file, {
      copy: true
    });
  };

  function Lazz() {
    logger.success("Hi", "This is Lazz");
  }

  Lazz.prototype.config = function(config) {
    _.extend(this._config, config);
    return this;
  };

  Lazz.prototype.global = function(data) {
    if (_.isPlainObject(data)) {
      _.extend(this._data.meta, data);
    } else {
      this.readGlobal(data);
    }
    return this;
  };

  Lazz.prototype.readGlobal = function(pattern) {
    var readJSON, root;
    readJSON = (function(_this) {
      return function(file) {
        if (utils.isJSON(file)) {
          return _this._data.meta[utils.keyname(file)] = fs.readJsonSync(_this.path_to(file));
        } else {
          return logger.info("readGlobal", file, "is not a JSON file");
        }
      };
    })(this);
    root = this.path_to(".");
    glob(pattern, {
      cwd: root
    }, function(error, files) {
      var file, _i, _len, _results;
      if (error) {
        return logger.error("readGlobal", pattern, error);
      } else {
        _results = [];
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          file = files[_i];
          _results.push(readJSON(file));
        }
        return _results;
      }
    });
    return this;
  };

  Lazz.prototype.transform = function(cb) {
    return cb(this._data);
  };

  Lazz.prototype.filter = function(filter) {
    return _.extend(this._data.filter, filter);
  };

  Lazz.prototype.content = function(type, pattern, meta) {
    var root;
    root = this.path_to(".");
    console.log("root -> ", root);
    glob(pattern, {
      cwd: root
    }, (function(_this) {
      return function(error, files) {
        var file, _base, _i, _len;
        console.log("files -> ", files);
        if (error) {
          return logger.error("content", pattern, error);
        } else {
          if ((_base = _this._data.file)[type] == null) {
            _base[type] = [];
          }
          console.log("type [" + type + "] -> ", _this._data.file[type]);
          for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            _this._read(type, file, meta);
          }
          return console.log("type [" + type + "] after -> ", _this._data.file[type]);
        }
      };
    })(this));
    return this;
  };

  Lazz.prototype.rest = function(pattern, meta) {
    return this.content("rest", pattern, meta);
  };

  Lazz.prototype.asset = function(pattern, meta) {
    this._data.asset.push(path.dirname(pattern));
    return this.content("asset", pattern, meta);
  };

  Lazz.prototype._read = function(type, file, meta) {
    var buffer, data;
    if (!utils.isFile(this.path_to(file))) {
      return;
    }
    console.log("it is file at last");
    buffer = fs.readFileSync(this.path_to(file));
    data = this._parse(buffer.toString(), meta);
    data.path = utils.fixPath(file);
    data.__source = this.path_to(file);
    data.__extname = path.extname(file);
    return this._data.file[type].push(data);
  };

  Lazz.prototype._parse = function(buffer, meta) {
    var data, parsed;
    if (meta == null) {
      meta = {};
    }
    parsed = fm(buffer);
    data = _.cloneDeep(meta);
    _.extend(data, parsed.attributes);
    data.content = parsed.body;
    return data;
  };

  Lazz.prototype.thatsAll = function() {
    var file, files, type, _i, _len, _ref;
    console.log("thatsAll -> ", this._data.file);
    _ref = this._data.file;
    for (type in _ref) {
      files = _ref[type];
      console.log(type);
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        this._write(file);
      }
    }
    return this;
  };

  Lazz.prototype._write = function(file) {
    return this._compile(file, (function(_this) {
      return function(error, content, options) {
        if (options == null) {
          options = {};
        }
        if (options.copy) {
          return fs.copy(file.__source, file.path, function(error) {
            if (error) {
              return logger.error("copy", file.__source, error);
            } else {
              return logger.success("copied", file.__source);
            }
          });
        } else {
          return fs.outputFile(_this.dest_to(file.path), content, function(error) {
            if (error) {
              return logger.error("output", file.__source, error);
            } else {
              return logger.success("processed", file.__source);
            }
          });
        }
      };
    })(this));
  };

  Lazz.prototype._compile = function(file, cb) {
    var compile;
    compile = this._resolveCompiler(file.__extname);
    return compile(file, this._data, this._resolveLayout(file.layout), cb);
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

  Lazz.prototype._resolveLayout = function(layout) {
    var file;
    if (!layout) {
      return;
    }
    if (this._layouts[layout]) {
      return this._layouts[layout];
    }
    file = path.resolve(this._config.layout, "" + layout + ".jade");
    return this._layouts[layout] = jade.compileFile(file);
  };

  Lazz.prototype.clean = function() {
    return rm(this._config.destination);
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
