var coffee, coffeeCompiler, jade, jadeCompiler, marked, markedCompiler, stylus, stylusCompiler, _;

_ = require("lodash");

jade = require("jade");

stylus = require("stylus");

coffee = require("coffee-script");

marked = require("marked");

markedCompiler = {
  extnames: [".md", ".mkd", ".markdown"],
  runner: function(file, _arg, done) {
    var data, layout;
    data = _arg.data, layout = _arg.layout;
    file._content = marked(file.content);
    if (layout) {
      data.page = file;
      data.content = file._content;
      return done(null, layout(data));
    } else {
      return done(null, file._content);
    }
  }
};

jadeCompiler = {
  extnames: [".jade"],
  runner: function(file, _arg, done) {
    var data, layout;
    data = _arg.data, layout = _arg.layout;
    data.page = file;
    data.content = void 0;
    file._content = jade.renderFile(file.__source, data);
    if (layout) {
      data.content = file._content;
      return done(null, layout(data));
    } else {
      return done(null, file._content);
    }
  }
};

stylusCompiler = {
  extnames: [".styl"],
  runner: function(file, _arg, done) {
    var data, opts, storage;
    data = _arg.data, storage = _arg.storage;
    opts = {
      filename: file.path,
      paths: storage.path
    };
    return stylus.render(file.content, opts, done);
  }
};

coffeeCompiler = {
  extnames: [".coffee"],
  runner: function(file, _arg, done) {
    var data, options;
    data = _arg.data, options = _arg.options;
    return done(null, coffee.compile(file.content, options));
  }
};

module.exports = [jadeCompiler, stylusCompiler, coffeeCompiler, markedCompiler];
